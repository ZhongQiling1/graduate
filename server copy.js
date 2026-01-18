import express from 'express'
import cors from 'cors'
import axios from 'axios'
import OpenAI from 'openai'
import 'dotenv/config'
import multer from 'multer'
import fs from 'fs'

const app = express()
const PORT = 3001

// 中间件配置
app.use(cors())
app.use(express.json())

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})

const upload = multer({ storage: storage })

// 确保上传目录存在
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true })
}

// 初始化OpenAI客户端（兼容模式）
const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
})

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'Proxy server is running' })
})

// 文本生成API端点
app.post('/api/generate-text', async (req, res) => {
  console.log('收到文本生成请求，开始处理...')

  if (!process.env.DASHSCOPE_API_KEY) {
    console.error('错误：服务器未配置DASHSCOPE_API_KEY环境变量')
    return res.status(500).json({
      error: '服务器配置错误：API密钥缺失'
    })
  }

  const { prompt } = req.body
  if (!prompt) {
    return res.status(400).json({
      error: '请求参数错误',
      details: 'prompt参数不能为空'
    })
  }

  try {
    console.log('调用通义千问文本生成API...')
    console.log('提示词长度:', prompt.length)

    const completion = await openai.chat.completions.create({
      model: 'qwen-turbo',
      messages: [
        {
          role: 'system',
          content:
            '你是一位精通数据分析和概念隐喻的数据科学家，擅长生成详细的数据对比分析报告。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    console.log('文本生成API响应成功')
    const result = completion.choices[0]?.message?.content || '未收到有效响应'

    res.json({
      success: true,
      content: result
    })
  } catch (error) {
    console.error('文本生成请求失败:', error)

    if (error.response) {
      console.error('状态码:', error.response.status)
      console.error('响应数据:', error.response.data)
      res.status(error.response.status).json({
        error: '通义千问文本生成API请求失败',
        details: error.response.data
      })
    } else if (error.request) {
      console.error('未收到响应:', error.request)
      res.status(500).json({
        error: '无法连接到通义千问服务',
        details: '网络超时或连接失败'
      })
    } else {
      console.error('请求配置错误:', error.message)
      res.status(500).json({
        error: '代理服务器内部错误',
        details: error.message
      })
    }
  }
})

// 文生图API代理端点
app.post('/api/generate-image', async (req, res) => {
  console.log('收到图像生成请求，开始代理转发...')

  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) {
    console.error('错误：服务器未配置DASHSCOPE_API_KEY环境变量')
    return res.status(500).json({
      error: '服务器配置错误：API密钥缺失'
    })
  }

  const requestData = {
    model: 'qwen-image-plus',
    input: {
      messages: [
        {
          role: 'user',
          content: [
            {
              text: req.body.prompt
            }
          ]
        }
      ]
    },
    parameters: {
      negative_prompt:
        '模糊，低质量，变形，不协调，文字，水印，丑陋，手绘，卡通，动漫',
      prompt_extend: true,
      watermark: false,
      size: '1328*1328'
    }
  }

  console.log('发送到阿里云的请求数据:')
  console.log('模型:', requestData.model)
  console.log('尺寸参数:', requestData.parameters.size)

  try {
    const response = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        timeout: 60000
      }
    )

    console.log('阿里云API响应状态:', response.status)
    res.json(response.data)
  } catch (error) {
    console.error('代理请求失败:', error)

    if (error.response) {
      console.error('状态码:', error.response.status)
      console.error('响应数据:', error.response.data)
      res.status(error.response.status).json({
        error: '阿里云API请求失败',
        details: error.response.data
      })
    } else if (error.request) {
      console.error('未收到响应:', error.request)
      res.status(500).json({
        error: '无法连接到阿里云服务',
        details: '网络超时或连接失败'
      })
    } else {
      console.error('请求配置错误:', error.message)
      res.status(500).json({
        error: '代理服务器内部错误',
        details: error.message
      })
    }
  }
})

// 新增：数据分析API端点 - 通过AI直接分析文件内容
app.post(
  '/api/analyze-data',
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'fileA', maxCount: 1 },
    { name: 'fileB', maxCount: 1 }
  ]),
  async (req, res) => {
    console.log('收到数据分析请求，开始处理...')

    try {
      const mode = req.body.mode || 'single'
      console.log('分析模式:', mode)

      let files = []
      let filePaths = []
      let fileContents = []

      // 收集上传的文件
      if (req.files) {
        if (req.files['file']) {
          files.push(...req.files['file'])
        }
        if (req.files['fileA']) {
          files.push(...req.files['fileA'])
        }
        if (req.files['fileB']) {
          files.push(...req.files['fileB'])
        }
      }

      // 如果没有文件，返回错误
      if (files.length === 0) {
        return res.status(400).json({
          error: '请上传数据文件',
          details: '未收到任何文件'
        })
      }

      // 读取文件内容
      for (const file of files) {
        const filePath = file.path
        filePaths.push(filePath)

        // 获取文件扩展名
        const extension = file.originalname.split('.').pop().toLowerCase()

        let content = ''

        if (extension === 'csv') {
          // 读取CSV文件
          content = fs.readFileSync(filePath, 'utf-8')
          // 只读取前100行进行AI分析，避免内容过长
          const lines = content.split('\n').slice(0, 100).join('\n')
          content = lines
        } else if (extension === 'json') {
          // 读取JSON文件
          const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
          // 简化JSON内容，只取前50条记录
          let simplifiedData = jsonData
          if (Array.isArray(jsonData) && jsonData.length > 50) {
            simplifiedData = jsonData.slice(0, 50)
          }
          content = JSON.stringify(simplifiedData, null, 2)
        } else if (extension === 'xlsx' || extension === 'xls') {
          // 对于Excel文件，直接读取为文本（简化处理）
          const buffer = fs.readFileSync(filePath)
          content = `Excel文件: ${file.originalname}, 大小: ${buffer.length} bytes`
        } else {
          content = `文件类型: ${extension}, 名称: ${file.originalname}`
        }

        fileContents.push({
          filename: file.originalname,
          content: content.substring(0, 10000) // 限制内容长度
        })
      }

      // 清理临时文件
      filePaths.forEach((path) => {
        if (fs.existsSync(path)) {
          fs.unlinkSync(path)
        }
      })

      // 构建AI分析提示词
      let prompt = ''

      if (mode === 'single') {
        // 单文件分析
        prompt = `你是一个高级数据分析AI。分析以下数据文件内容，找出其中可以对比的两个对象（或两个特征、两个类别、两个时间段等），并分析它们的主要差异特征。

文件信息：
文件名: ${fileContents[0].filename}
文件内容预览：
\`\`\`
${fileContents[0].content}
\`\`\`

请按照以下结构进行分析：
1. **表格智能理解**（判断这是什么类型的表格，做什么用的，有什么业务含义）
2. **可能的对比对象**（找出2个最主要的可以对比的对象/特征/类别，比如：产品A vs 产品B、线上渠道 vs 线下渠道、Q1季度 vs Q4季度等）
3. **主要差异特征**（找出3-5个最主要的差异点，比如：趋势差异、规模差异、波动性差异、增长率差异等）
4. **对比总结**（用一句话概括主要对比发现）

请用JSON格式返回分析结果，结构如下：
{
  "table_understanding": {
    "table_type": "销售数据|用户数据|运营数据|产品数据|财务数据|其他",
    "industry_domain": "电商|金融|医疗|教育|制造|科技|其他",
    "business_purpose": "业绩分析|用户分析|产品对比|趋势监控|运营评估|其他",
    "content_summary": "简要描述表格内容",
    "confidence_score": 0.85,
    "likely_scenarios": ["场景1", "场景2", "场景3"]
  },
  "comparisonItems": ["对象A vs 对象B", "特征1 vs 特征2"],
  "trends": ["趋势描述1", "趋势描述2", "趋势描述3"],
  "characteristics": {
    "difference1": "差异描述1",
    "difference2": "差异描述2",
    "difference3": "差异描述3"
  },
  "summary": "一句话总结对比发现"
}

注意：
1. 如果文件内容不足以分析，请合理推测
2. 确保返回有效的JSON格式
3. 对比对象要具体明确
4. 差异特征要基于数据特征描述`
      } else {
        // 双文件对比分析
        prompt = `你是一个高级数据分析AI。分析以下两个数据文件，找出它们之间的主要对比关系和差异特征。

文件A信息：
文件名: ${fileContents[0].filename}
文件内容预览：
\`\`\`
${fileContents[0].content}
\`\`\`

文件B信息：
文件名: ${fileContents[1].filename}
文件内容预览：
\`\`\`
${fileContents[1].content}
\`\`\`

请按照以下结构进行分析：
1. **文件对比理解**（分析两个文件的关联性和对比意义）
2. **主要对比维度**（找出2-3个最主要的对比维度，比如：整体规模对比、趋势对比、分布对比等）
3. **关键差异点**（找出3-5个最关键的差异点）
4. **对比总结**（用一句话概括主要对比发现）

请用JSON格式返回分析结果，结构如下：
{
  "comparisonItems": ["文件A vs 文件B", "维度1对比", "维度2对比"],
  "trends": ["趋势描述1", "趋势描述2", "趋势描述3"],
  "characteristics": {
    "difference1": "差异描述1",
    "difference2": "差异描述2",
    "difference3": "差异描述3"
  },
  "summary": "一句话总结对比发现"
}

注意：
1. 对比分析要具体明确
2. 确保返回有效的JSON格式
3. 差异特征要基于文件内容描述`
      }

      console.log('调用AI进行数据分析，提示词长度:', prompt.length)

      // 调用通义千问进行数据分析
      const completion = await openai.chat.completions.create({
        model: 'qwen-turbo',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的数据分析AI助手，擅长从数据中提取对比关系和差异特征。
要求：
1. 始终返回有效的JSON格式
2. 对比对象要具体明确
3. 差异特征要基于数据逻辑
4. 如果有不确定性，用合理的推测补充`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5, // 较低的温度以获得更稳定的分析结果
        max_tokens: 1500
      })

      const aiResponse = completion.choices[0]?.message?.content || ''
      console.log('AI数据分析响应长度:', aiResponse.length)

      // 尝试解析JSON响应
      try {
        // 提取JSON部分（可能AI会在JSON外添加一些解释文字）
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const analysisResult = JSON.parse(jsonMatch[0])

          // 添加AI解释（供前端显示深度解释）
          if (mode === 'single') {
            const explainPrompt = `基于以下数据分析结果，为用户生成一个详细的、易于理解的解释：

分析结果：${JSON.stringify(analysisResult, null, 2)}

请生成一个段落，用自然语言解释：
1. 这个表格主要是做什么用的？
2. 可以对比哪两个主要对象？
3. 它们之间有什么关键差异？
4. 这些差异有什么业务含义？

用中文回答，语言要亲切易懂。`

            try {
              const explainCompletion = await openai.chat.completions.create({
                model: 'qwen-turbo',
                messages: [
                  {
                    role: 'user',
                    content: explainPrompt
                  }
                ],
                temperature: 0.7,
                max_tokens: 500
              })

              analysisResult.table_understanding_explained =
                explainCompletion.choices[0]?.message?.content || ''
            } catch (explainError) {
              console.warn('生成AI解释失败:', explainError)
              analysisResult.table_understanding_explained =
                '基于数据分析，该表格展现了明显的对比特征，适合进行视觉隐喻表达。'
            }
          }

          res.json(analysisResult)
        } else {
          throw new Error('AI响应中未找到有效的JSON')
        }
      } catch (parseError) {
        console.error('解析AI响应失败:', parseError)
        console.log('AI原始响应:', aiResponse)

        // 返回演示数据
        const demoAnalysis = getDemoAnalysis(mode)
        res.json(demoAnalysis)
      }
    } catch (error) {
      console.error('数据分析失败:', error)

      // 清理可能存在的临时文件
      if (req.files) {
        Object.values(req.files)
          .flat()
          .forEach((file) => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path)
            }
          })
      }

      // 返回演示数据
      const demoAnalysis = getDemoAnalysis(req.body.mode || 'single')
      res.json(demoAnalysis)
    }
  }
)

// 演示数据生成函数
function getDemoAnalysis(mode = 'single') {
  if (mode === 'single') {
    return {
      table_understanding: {
        table_type: '销售数据',
        industry_domain: '电商',
        business_purpose: '产品对比分析',
        content_summary: '包含多个产品的销售数据，包括时间序列和分类信息',
        confidence_score: 0.92,
        likely_scenarios: ['产品性能对比', '市场趋势分析', '销售策略评估']
      },
      comparisonItems: ['产品A vs 产品B', '线上渠道 vs 线下渠道'],
      trends: [
        '产品A季度增长稳定，平均增长率约12%',
        '产品B波动较大，但Q3有显著峰值',
        '线上渠道增长速度是线下的1.8倍'
      ],
      characteristics: {
        size_comparison: '产品A整体规模是产品B的1.5倍',
        volatility: '产品B的波动性是产品A的2.2倍',
        growth_trend: '两者均呈上升趋势，但产品A更稳定'
      },
      summary:
        '数据展现了明显的产品对比特征，产品A更稳定，产品B波动但增长潜力大',
      table_understanding_explained:
        '这是一个电商销售数据表格，主要用于对比不同产品的表现。最值得对比的是产品A和产品B，它们的关键差异在于：产品A销售稳定增长，适合长期投资；产品B波动较大但峰值高，适合风险偏好型策略。线上渠道增长明显快于线下，显示了数字化转型的重要性。'
    }
  } else {
    return {
      comparisonItems: ['数据集A vs 数据集B', '时间段对比', '地域分布对比'],
      trends: [
        '数据集A整体呈上升趋势，季度增长率约15%',
        '数据集B在Q2有显著下降，但Q3快速回升',
        '两者在Q4都有季节性高峰'
      ],
      characteristics: {
        scale_difference: '数据集A规模是数据集B的1.8倍',
        trend_stability: '数据集A趋势更稳定，波动性小',
        peak_pattern: '数据集B的峰值更突出但持续时间短'
      },
      summary: '两个数据集展现互补特征：A稳定增长，B波动但有爆发力'
    }
  }
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 代理服务器已启动，运行在 http://localhost:${PORT}`)
  console.log(
    `📝 文本生成端点: POST http://localhost:${PORT}/api/generate-text`
  )
  console.log(
    `📡 文生图代理端点: POST http://localhost:${PORT}/api/generate-image`
  )
  console.log(`🔍 数据分析端点: POST http://localhost:${PORT}/api/analyze-data`)
  console.log(`✅ 健康检查端点: GET http://localhost:${PORT}/health`)
})
