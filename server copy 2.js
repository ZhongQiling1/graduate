import express from 'express'
import cors from 'cors'
import axios from 'axios'
import OpenAI from 'openai'
import 'dotenv/config'
import multer from 'multer'
import fs from 'fs'
import csv from 'csv-parser'
import xlsx from 'xlsx'

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

// 新增：提取数值特征函数
async function extractNumericalFeatures(filePath, filename, mode = 'single') {
  const extension = filename.split('.').pop().toLowerCase()

  try {
    if (extension === 'csv') {
      return await parseCSVFile(filePath)
    } else if (extension === 'json') {
      return parseJSONFile(filePath)
    } else if (extension === 'xlsx' || extension === 'xls') {
      return parseExcelFile(filePath)
    } else {
      // 对于其他格式，返回默认数值特征
      return getDefaultNumericalFeatures()
    }
  } catch (error) {
    console.error(`解析文件 ${filename} 失败:`, error)
    return getDefaultNumericalFeatures()
  }
}

// 解析CSV文件
async function parseCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = []
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        if (results.length < 100) {
          // 限制读取前100行
          results.push(data)
        }
      })
      .on('end', () => {
        if (results.length === 0) {
          resolve(getDefaultNumericalFeatures())
          return
        }

        // 分析数值特征
        const features = analyzeCSVData(results)
        resolve(features)
      })
      .on('error', reject)
  })
}

// 分析CSV数据
function analyzeCSVData(data) {
  if (data.length === 0) return getDefaultNumericalFeatures()

  // 尝试识别数值列
  const numericColumns = []
  const sampleRow = data[0]

  for (const [key, value] of Object.entries(sampleRow)) {
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      numericColumns.push(key)
    }
  }

  if (numericColumns.length === 0) {
    return getDefaultNumericalFeatures()
  }

  // 提取数值数据
  const numericData = {}
  numericColumns.forEach((col) => {
    const values = data
      .map((row) => parseFloat(row[col]))
      .filter((v) => !isNaN(v))
    if (values.length > 0) {
      numericData[col] = values
    }
  })

  // 如果有多列数值，尝试找到对比的两列
  const columns = Object.keys(numericData)
  if (columns.length >= 2) {
    // 使用前两列作为对比
    const colA = columns[0]
    const colB = columns[1]

    const valuesA = numericData[colA]
    const valuesB = numericData[colB]

    return calculateNumericalFeatures(valuesA, valuesB, colA, colB)
  } else if (columns.length === 1) {
    // 单列数据，拆分为两部分对比
    const values = numericData[columns[0]]
    const midIndex = Math.floor(values.length / 2)
    const valuesA = values.slice(0, midIndex)
    const valuesB = values.slice(midIndex)

    return calculateNumericalFeatures(valuesA, valuesB, '前半段', '后半段')
  }

  return getDefaultNumericalFeatures()
}

// 解析JSON文件
function parseJSONFile(filePath) {
  const rawData = fs.readFileSync(filePath, 'utf-8')
  const data = JSON.parse(rawData)

  if (Array.isArray(data)) {
    // 数组数据
    if (data.length === 0) return getDefaultNumericalFeatures()

    // 尝试找到数值字段
    const sampleItem = data[0]
    const numericFields = []

    for (const [key, value] of Object.entries(sampleItem)) {
      if (typeof value === 'number') {
        numericFields.push(key)
      }
    }

    if (numericFields.length >= 2) {
      const fieldA = numericFields[0]
      const fieldB = numericFields[1]

      const valuesA = data
        .map((item) => item[fieldA])
        .filter((v) => typeof v === 'number')
      const valuesB = data
        .map((item) => item[fieldB])
        .filter((v) => typeof v === 'number')

      return calculateNumericalFeatures(valuesA, valuesB, fieldA, fieldB)
    }
  }

  return getDefaultNumericalFeatures()
}

// 解析Excel文件
function parseExcelFile(filePath) {
  const workbook = xlsx.readFile(filePath)
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = xlsx.utils.sheet_to_json(firstSheet, { header: 1 })

  if (data.length <= 1) return getDefaultNumericalFeatures()

  // 转换数据格式
  const headers = data[0]
  const rows = data.slice(1, 11) // 只取前10行

  // 识别数值列
  const numericCols = []
  headers.forEach((header, index) => {
    if (header) {
      const values = rows
        .map((row) => row[index])
        .filter((v) => v !== undefined)
      const hasNumeric = values.some((v) => !isNaN(parseFloat(v)))
      if (hasNumeric) {
        numericCols.push({
          name: header,
          index,
          values: values.map((v) => parseFloat(v)).filter((v) => !isNaN(v))
        })
      }
    }
  })

  if (numericCols.length >= 2) {
    const colA = numericCols[0]
    const colB = numericCols[1]

    return calculateNumericalFeatures(
      colA.values,
      colB.values,
      colA.name,
      colB.name
    )
  }

  return getDefaultNumericalFeatures()
}

// 计算数值特征
function calculateNumericalFeatures(valuesA, valuesB, labelA, labelB) {
  if (valuesA.length === 0 || valuesB.length === 0) {
    return getDefaultNumericalFeatures()
  }

  // 计算统计特征
  const meanA = valuesA.reduce((a, b) => a + b, 0) / valuesA.length
  const meanB = valuesB.reduce((a, b) => a + b, 0) / valuesB.length

  const maxA = Math.max(...valuesA)
  const minA = Math.min(...valuesA)
  const maxB = Math.max(...valuesB)
  const minB = Math.min(...valuesB)

  // 计算波动性（标准差）
  const stdA = Math.sqrt(
    valuesA.reduce((sq, n) => sq + Math.pow(n - meanA, 2), 0) / valuesA.length
  )
  const stdB = Math.sqrt(
    valuesB.reduce((sq, n) => sq + Math.pow(n - meanB, 2), 0) / valuesB.length
  )

  // 计算比例
  const sizeRatio = meanA / meanB
  const volatilityRatio = stdA / stdB

  return {
    size_ratio: Math.abs(sizeRatio),
    volatility_ratio: Math.abs(volatilityRatio),
    trend_slopes: {
      entityA: calculateTrendSlope(valuesA),
      entityB: calculateTrendSlope(valuesB)
    },
    values: {
      entityA: {
        label: labelA,
        mean: parseFloat(meanA.toFixed(2)),
        max: parseFloat(maxA.toFixed(2)),
        min: parseFloat(minA.toFixed(2)),
        current: valuesA[valuesA.length - 1] || meanA,
        std: parseFloat(stdA.toFixed(2))
      },
      entityB: {
        label: labelB,
        mean: parseFloat(meanB.toFixed(2)),
        max: parseFloat(maxB.toFixed(2)),
        min: parseFloat(minB.toFixed(2)),
        current: valuesB[valuesB.length - 1] || meanB,
        std: parseFloat(stdB.toFixed(2))
      }
    }
  }
}

// 计算趋势斜率（简单线性回归）
function calculateTrendSlope(values) {
  if (values.length < 2) return 0

  const n = values.length
  const x = Array.from({ length: n }, (_, i) => i)

  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  return parseFloat((slope / (values[0] || 1)).toFixed(4)) // 归一化斜率
}

// 默认数值特征
function getDefaultNumericalFeatures() {
  return {
    size_ratio: 1.8,
    volatility_ratio: 2.3,
    trend_slopes: {
      entityA: 0.15,
      entityB: 0.08
    },
    values: {
      entityA: {
        label: '实体A',
        mean: 1500,
        max: 2000,
        min: 1000,
        current: 1800,
        std: 250
      },
      entityB: {
        label: '实体B',
        mean: 850,
        max: 1300,
        min: 600,
        current: 1000,
        std: 150
      }
    }
  }
}

// 数据分析API端点 - 增强版，支持数值提取
app.post(
  '/api/analyze-data',
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'fileA', maxCount: 1 },
    { name: 'fileB', maxCount: 1 }
  ]),
  async (req, res) => {
    console.log('收到数据分析请求，开始处理...')

    // 检查是否要求量化分析
    const quantify = req.body.quantify === 'true'
    console.log('量化分析模式:', quantify)

    try {
      const mode = req.body.mode || 'single'
      console.log('分析模式:', mode)

      let files = []
      let filePaths = []
      let fileContents = []
      let numericalFeatures = null

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

      // 如果是量化分析，先提取数值特征
      if (quantify && files.length > 0) {
        try {
          const file = files[0]
          console.log('开始提取数值特征:', file.originalname)
          numericalFeatures = await extractNumericalFeatures(
            file.path,
            file.originalname,
            mode
          )
          console.log('数值特征提取成功:', numericalFeatures)
        } catch (featureError) {
          console.warn('数值特征提取失败，使用默认值:', featureError)
          numericalFeatures = getDefaultNumericalFeatures()
        }
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

      // 构建AI分析提示词 - 增强版，包含数值特征
      let prompt = ''

      if (mode === 'single') {
        // 单文件分析 - 增强提示词
        let numericalContext = ''
        if (numericalFeatures) {
          const values = numericalFeatures.values
          numericalContext = `\n\n数值分析结果：
- ${values.entityA.label}: 平均值 ${values.entityA.mean}, 当前值 ${
            values.entityA.current
          }, 范围 ${values.entityA.min}-${values.entityA.max}
- ${values.entityB.label}: 平均值 ${values.entityB.mean}, 当前值 ${
            values.entityB.current
          }, 范围 ${values.entityB.min}-${values.entityB.max}
- 大小比例: ${numericalFeatures.size_ratio.toFixed(2)}:1
- 波动性比例: ${numericalFeatures.volatility_ratio.toFixed(2)}:1`
        }

        prompt = `你是一个高级数据分析AI。分析以下数据文件内容，找出其中可以对比的两个对象（或两个特征、两个类别、两个时间段等），并分析它们的主要差异特征。${numericalContext}

文件信息：
文件名: ${fileContents[0].filename}
文件内容预览：
\`\`\`
${fileContents[0].content}
\`\`\`

请按照以下结构进行分析：
1. **表格智能理解**（判断这是什么类型的表格，做什么用的，有什么业务含义）
2. **可能的对比对象**（找出2个最主要的可以对比的对象/特征/类别）
3. **主要差异特征**（找出3-5个最主要的差异点，包括数值差异）
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
    "sizeComparison": "大小/规模对比描述（如：A是B的1.8倍）",
    "volatility": "波动性对比描述（如：B的波动性是A的2.3倍）",
    "trendDirection": "趋势方向对比",
    "correlation": "相关性描述",
    "distributionType": "分布类型对比"
  },
  "summary": "一句话总结对比发现",
  "numerical_features": ${JSON.stringify(
    numericalFeatures || getDefaultNumericalFeatures()
  )}
}

注意：
1. 使用具体的数值描述差异
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
2. **主要对比维度**（找出2-3个最主要的对比维度）
3. **关键差异点**（找出3-5个最关键的差异点，包括数值差异）
4. **对比总结**（用一句话概括主要对比发现）

请用JSON格式返回分析结果，结构如下：
{
  "comparisonItems": ["文件A vs 文件B", "维度1对比", "维度2对比"],
  "trends": ["趋势描述1", "趋势描述2", "趋势描述3"],
  "characteristics": {
    "sizeComparison": "大小/规模对比描述",
    "volatility": "波动性对比描述",
    "trendDirection": "趋势方向对比",
    "distributionType": "分布类型对比"
  },
  "summary": "一句话总结对比发现",
  "numerical_features": ${JSON.stringify(
    numericalFeatures || getDefaultNumericalFeatures()
  )}
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
4. 使用具体的数值描述差异
5. 如果有数值特征，请基于它们进行分析`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5, // 较低的温度以获得更稳定的分析结果
        max_tokens: 2000
      })

      const aiResponse = completion.choices[0]?.message?.content || ''
      console.log('AI数据分析响应长度:', aiResponse.length)

      // 尝试解析JSON响应
      try {
        // 提取JSON部分（可能AI会在JSON外添加一些解释文字）
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          let analysisResult = JSON.parse(jsonMatch[0])

          // 确保包含数值特征
          if (!analysisResult.numerical_features && numericalFeatures) {
            analysisResult.numerical_features = numericalFeatures
          } else if (!analysisResult.numerical_features) {
            analysisResult.numerical_features = getDefaultNumericalFeatures()
          }

          // 添加AI解释（供前端显示深度解释）
          if (mode === 'single') {
            const explainPrompt = `基于以下数据分析结果（特别是数值特征），为用户生成一个详细的、易于理解的解释：

分析结果：${JSON.stringify(analysisResult, null, 2)}

请生成一个段落，用自然语言解释：
1. 这个表格主要是做什么用的？
2. 可以对比哪两个主要对象？它们的数值特征是什么？
3. 它们之间有什么关键差异？（特别是数值差异）
4. 这些差异有什么业务含义？

用中文回答，语言要亲切易懂，突出数值对比。`

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
                '基于数据分析，该表格展现了明显的对比特征，特别是数值差异，适合进行精确的视觉隐喻表达。'
            }
          }

          res.json(analysisResult)
        } else {
          throw new Error('AI响应中未找到有效的JSON')
        }
      } catch (parseError) {
        console.error('解析AI响应失败:', parseError)
        console.log('AI原始响应:', aiResponse)

        // 返回演示数据（包含数值特征）
        const demoAnalysis = getDemoAnalysis(mode, numericalFeatures)
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

      // 返回演示数据（包含数值特征）
      const demoAnalysis = getDemoAnalysis(req.body.mode || 'single')
      res.json(demoAnalysis)
    }
  }
)

// 增强版演示数据生成函数（包含数值特征）
function getDemoAnalysis(mode = 'single', numericalFeatures = null) {
  const baseAnalysis = {
    numerical_features: numericalFeatures || getDefaultNumericalFeatures()
  }

  if (mode === 'single') {
    return {
      ...baseAnalysis,
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
        sizeComparison: `产品A整体规模是产品B的${(
          baseAnalysis.numerical_features.size_ratio || 1.8
        ).toFixed(1)}倍`,
        volatility: `产品B的波动性是产品A的${(
          baseAnalysis.numerical_features.volatility_ratio || 2.3
        ).toFixed(1)}倍`,
        trendDirection: '两者均呈上升趋势，但产品A更稳定',
        correlation: '正相关，但产品B波动性更大',
        distributionType: '产品A分布更集中，产品B分布更分散'
      },
      summary:
        '数据展现了明显的产品对比特征，产品A更稳定，产品B波动但增长潜力大',
      table_understanding_explained: `这是一个电商销售数据表格，主要用于对比不同产品的表现。最值得对比的是产品A（当前值${
        baseAnalysis.numerical_features.values.entityA.current
      }）和产品B（当前值${
        baseAnalysis.numerical_features.values.entityB.current
      }），它们的关键差异在于：产品A销售稳定增长，规模是产品B的${baseAnalysis.numerical_features.size_ratio.toFixed(
        1
      )}倍；产品B波动较大但峰值高，波动性是产品A的${baseAnalysis.numerical_features.volatility_ratio.toFixed(
        1
      )}倍。线上渠道增长明显快于线下，显示了数字化转型的重要性。`
    }
  } else {
    return {
      ...baseAnalysis,
      comparisonItems: ['数据集A vs 数据集B', '时间段对比', '地域分布对比'],
      trends: [
        `数据集A整体呈上升趋势，季度增长率约${(
          baseAnalysis.numerical_features.trend_slopes.entityA * 100
        ).toFixed(1)}%`,
        `数据集B在Q2有显著下降，但Q3快速回升，趋势斜率${baseAnalysis.numerical_features.trend_slopes.entityB}`,
        '两者在Q4都有季节性高峰'
      ],
      characteristics: {
        sizeComparison: `数据集A规模是数据集B的${baseAnalysis.numerical_features.size_ratio.toFixed(
          1
        )}倍`,
        trendStability: '数据集A趋势更稳定，波动性小',
        peakPattern: '数据集B的峰值更突出但持续时间短',
        distributionType: '数据集A分布均匀，数据集B分布集中'
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
  console.log(`📊 支持的文件格式: CSV, JSON, Excel`)
})
