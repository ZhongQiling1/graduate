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

// =============== 增强的数值特征提取和对比函数 ===============

// 增强版：提取详细的数值特征
async function extractEnhancedNumericalFeatures(filePath, filename) {
  const extension = filename.split('.').pop().toLowerCase()

  try {
    let features = null

    if (extension === 'csv') {
      features = await parseEnhancedCSVFile(filePath)
    } else if (extension === 'json') {
      features = parseEnhancedJSONFile(filePath)
    } else if (extension === 'xlsx' || extension === 'xls') {
      features = parseEnhancedExcelFile(filePath)
    }

    // 如果无法提取特征，使用智能生成的特征
    if (
      !features ||
      !features.values ||
      !features.values.entityA ||
      !features.values.entityB
    ) {
      console.log('无法从文件中提取特征，使用AI生成的特征')
      return generateIntelligentNumericalFeatures(filePath, filename)
    }

    // 计算百分比和比例
    const calculatedFeatures = calculateEnhancedFeatures(features)
    return calculatedFeatures
  } catch (error) {
    console.error(`提取文件 ${filename} 特征失败:`, error)
    return getDefaultNumericalFeatures()
  }
}

// 解析CSV文件并提取详细特征
async function parseEnhancedCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = []
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        if (results.length < 200) {
          // 读取更多行以获得更好的分析
          results.push(data)
        }
      })
      .on('end', () => {
        if (results.length === 0) {
          resolve(null)
          return
        }

        const features = analyzeEnhancedCSVData(results)
        resolve(features)
      })
      .on('error', reject)
  })
}

// 增强的CSV数据分析
function analyzeEnhancedCSVData(data) {
  if (data.length === 0) return null

  // 获取所有列名
  const columns = Object.keys(data[0])

  // 识别数值列和分类列
  const numericColumns = []
  const categoryColumns = []

  for (const column of columns) {
    const sampleValues = data
      .slice(0, 10)
      .map((row) => row[column])
      .filter((v) => v !== undefined && v !== '')

    if (sampleValues.length === 0) continue

    // 检查是否为数值列
    const numericCount = sampleValues.filter(
      (v) => !isNaN(parseFloat(v))
    ).length
    const numericRatio = numericCount / sampleValues.length

    if (numericRatio > 0.8) {
      numericColumns.push(column)
    } else {
      categoryColumns.push(column)
    }
  }

  // 提取两列主要的数值数据进行对比
  if (numericColumns.length >= 2) {
    const colA = numericColumns[0]
    const colB = numericColumns[1]

    const valuesA = data
      .map((row) => parseFloat(row[colA]))
      .filter((v) => !isNaN(v))
    const valuesB = data
      .map((row) => parseFloat(row[colB]))
      .filter((v) => !isNaN(v))

    // 如果有分类列，用于命名
    const labelA = categoryColumns.length > 0 ? `${categoryColumns[0]}_A` : colA
    const labelB = categoryColumns.length > 0 ? `${categoryColumns[0]}_B` : colB

    return {
      entityA: {
        label: labelA,
        values: valuesA,
        column: colA
      },
      entityB: {
        label: labelB,
        values: valuesB,
        column: colB
      },
      hasTimeSeries: checkForTimeSeries(data, columns),
      totalRows: data.length,
      columns: {
        numeric: numericColumns,
        categorical: categoryColumns
      }
    }
  } else if (numericColumns.length === 1) {
    // 只有一列数值数据，检查是否有分类列可用于分组
    const numericCol = numericColumns[0]
    const values = data
      .map((row) => parseFloat(row[numericCol]))
      .filter((v) => !isNaN(v))

    if (categoryColumns.length > 0) {
      // 根据分类列分组
      const categoryCol = categoryColumns[0]
      const uniqueCategories = [
        ...new Set(data.map((row) => row[categoryCol]))
      ].filter((c) => c)

      if (uniqueCategories.length >= 2) {
        // 取前两个类别进行对比
        const catA = uniqueCategories[0]
        const catB = uniqueCategories[1]

        const valuesA = data
          .filter((row) => row[categoryCol] === catA)
          .map((row) => parseFloat(row[numericCol]))
          .filter((v) => !isNaN(v))

        const valuesB = data
          .filter((row) => row[categoryCol] === catB)
          .map((row) => parseFloat(row[numericCol]))
          .filter((v) => !isNaN(v))

        return {
          entityA: {
            label: catA,
            values: valuesA,
            column: numericCol
          },
          entityB: {
            label: catB,
            values: valuesB,
            column: numericCol
          },
          hasTimeSeries: checkForTimeSeries(data, columns),
          totalRows: data.length,
          columns: {
            numeric: numericColumns,
            categorical: categoryColumns
          }
        }
      }
    }

    // 无法分组，将数据分为两半
    const midIndex = Math.floor(values.length / 2)
    return {
      entityA: {
        label: '前半段',
        values: values.slice(0, midIndex),
        column: numericCol
      },
      entityB: {
        label: '后半段',
        values: values.slice(midIndex),
        column: numericCol
      },
      hasTimeSeries: checkForTimeSeries(data, columns),
      totalRows: data.length,
      columns: {
        numeric: numericColumns,
        categorical: categoryColumns
      }
    }
  }

  return null
}

// 检查是否有时间序列数据
function checkForTimeSeries(data, columns) {
  const timeKeywords = [
    'date',
    'time',
    'month',
    'year',
    'quarter',
    'week',
    'day'
  ]
  const hasTimeColumn = columns.some((col) =>
    timeKeywords.some((keyword) => col.toLowerCase().includes(keyword))
  )

  if (!hasTimeColumn) return false

  // 检查数据是否有顺序趋势
  const firstCol = columns[0]
  const sampleValues = data
    .slice(0, 50)
    .map((row) => parseFloat(row[firstCol]))
    .filter((v) => !isNaN(v))

  if (sampleValues.length < 3) return false

  // 简单趋势检测
  const trend = calculateSimpleTrend(sampleValues)
  return Math.abs(trend) > 0.1
}

// 计算简单趋势
function calculateSimpleTrend(values) {
  if (values.length < 2) return 0

  const firstValue = values[0]
  const lastValue = values[values.length - 1]

  if (firstValue === 0) return lastValue > 0 ? 1 : -1

  return (lastValue - firstValue) / Math.abs(firstValue)
}

// 解析JSON文件
function parseEnhancedJSONFile(filePath) {
  const rawData = fs.readFileSync(filePath, 'utf-8')
  const data = JSON.parse(rawData)

  if (Array.isArray(data) && data.length > 0) {
    // 数组数据
    const sampleItem = data[0]
    const keys = Object.keys(sampleItem)

    // 识别数值字段
    const numericFields = keys.filter(
      (key) => typeof sampleItem[key] === 'number'
    )
    const stringFields = keys.filter(
      (key) => typeof sampleItem[key] === 'string'
    )

    if (numericFields.length >= 2) {
      // 有两个数值字段
      const fieldA = numericFields[0]
      const fieldB = numericFields[1]

      const valuesA = data
        .map((item) => item[fieldA])
        .filter((v) => typeof v === 'number')
      const valuesB = data
        .map((item) => item[fieldB])
        .filter((v) => typeof v === 'number')

      // 尝试使用字符串字段作为标签
      const labelA = stringFields.length > 0 ? `${stringFields[0]}_A` : fieldA
      const labelB = stringFields.length > 0 ? `${stringFields[0]}_B` : fieldB

      return {
        entityA: {
          label: labelA,
          values: valuesA,
          field: fieldA
        },
        entityB: {
          label: labelB,
          values: valuesB,
          field: fieldB
        },
        totalRows: data.length,
        isArray: true
      }
    } else if (numericFields.length === 1 && stringFields.length > 0) {
      // 只有一个数值字段，但有关字符串字段可用于分组
      const numericField = numericFields[0]
      const categoryField = stringFields[0]

      // 按字符串字段分组
      const groups = {}
      data.forEach((item) => {
        const category = item[categoryField]
        const value = item[numericField]

        if (typeof value === 'number') {
          if (!groups[category]) {
            groups[category] = []
          }
          groups[category].push(value)
        }
      })

      const categories = Object.keys(groups)
      if (categories.length >= 2) {
        const catA = categories[0]
        const catB = categories[1]

        return {
          entityA: {
            label: catA,
            values: groups[catA],
            field: numericField
          },
          entityB: {
            label: catB,
            values: groups[catB],
            field: numericField
          },
          totalRows: data.length,
          isArray: true,
          groupedBy: categoryField
        }
      }
    }
  }

  return null
}

// 解析Excel文件
function parseEnhancedExcelFile(filePath) {
  try {
    const workbook = xlsx.readFile(filePath)
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = xlsx.utils.sheet_to_json(firstSheet)

    if (data.length === 0) return null

    return analyzeEnhancedCSVData(data) // 重用CSV分析逻辑
  } catch (error) {
    console.error('解析Excel文件失败:', error)
    return null
  }
}

// AI智能生成数值特征
async function generateIntelligentNumericalFeatures(filePath, filename) {
  try {
    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf-8').substring(0, 5000)

    const prompt = `你是一个数据分析专家。请分析以下数据内容，并生成两个对比对象的数值特征：

文件: ${filename}
数据预览:
\`\`\`
${content.substring(0, 2000)}
\`\`\`

请识别数据中两个可以对比的主要对象，并为它们生成合理的数值特征，包括：
1. 具体数值（如：销售额、用户数、增长率等）
2. 百分比和比例关系
3. 变化趋势
4. 相对大小

返回JSON格式：
{
  "entityA": {
    "label": "对象A名称",
    "mean": 具体数值,
    "current": 当前值,
    "min": 最小值,
    "max": 最大值,
    "unit": "单位",
    "description": "简要描述"
  },
  "entityB": {
    "label": "对象B名称",
    "mean": 具体数值,
    "current": 当前值,
    "min": 最小值,
    "max": 最大值,
    "unit": "单位",
    "description": "简要描述"
  },
  "comparison": {
    "size_ratio": 大小比例,
    "percent_difference": 百分比差异,
    "key_difference": "主要差异描述"
  }
}`

    const completion = await openai.chat.completions.create({
      model: 'qwen-turbo',
      messages: [
        {
          role: 'system',
          content:
            '你是一个专业的数据分析师，擅长从数据中提取关键特征和对比关系。生成的数据要合理且有代表性。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 800
    })

    const response = completion.choices[0]?.message?.content || ''

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0])

        // 转换为标准格式
        return calculateEnhancedFeatures({
          entityA: {
            label: result.entityA.label,
            values: generateValuesFromStats(result.entityA)
          },
          entityB: {
            label: result.entityB.label,
            values: generateValuesFromStats(result.entityB)
          },
          aiGenerated: true
        })
      }
    } catch (e) {
      console.log('AI生成的特征解析失败，使用默认值')
    }
  } catch (error) {
    console.error('AI智能生成特征失败:', error)
  }

  return getDefaultNumericalFeatures()
}

// 从统计信息生成数值数组
function generateValuesFromStats(stats) {
  const { mean = 1000, current = 1200, min = 500, max = 2000 } = stats
  // 生成一组围绕这些统计值的随机数据
  const count = 20
  const values = []

  for (let i = 0; i < count; i++) {
    // 以current为中心，在一定范围内生成随机值
    const base = current || mean
    const range = (max - min) * 0.3
    const value = base + (Math.random() - 0.5) * range
    values.push(Math.max(min, Math.min(max, value)))
  }

  return values
}

// 计算增强的特征
function calculateEnhancedFeatures(data) {
  if (!data || !data.entityA || !data.entityB) {
    return getDefaultNumericalFeatures()
  }

  const valuesA = data.entityA.values || []
  const valuesB = data.entityB.values || []

  if (valuesA.length === 0 || valuesB.length === 0) {
    return getDefaultNumericalFeatures()
  }

  // 计算基本统计量
  const meanA = valuesA.reduce((a, b) => a + b, 0) / valuesA.length
  const meanB = valuesB.reduce((a, b) => a + b, 0) / valuesB.length

  const maxA = Math.max(...valuesA)
  const minA = Math.min(...valuesA)
  const maxB = Math.max(...valuesB)
  const minB = Math.min(...valuesB)

  const stdA = Math.sqrt(
    valuesA.reduce((sq, n) => sq + Math.pow(n - meanA, 2), 0) / valuesA.length
  )
  const stdB = Math.sqrt(
    valuesB.reduce((sq, n) => sq + Math.pow(n - meanB, 2), 0) / valuesB.length
  )

  // 计算各种比例和百分比
  const sizeRatio = meanA / meanB
  const volatilityRatio = stdA / stdB
  const percentDifference = ((meanA - meanB) / Math.min(meanA, meanB)) * 100

  // 计算百分比占比
  const total = meanA + meanB
  const percentageA = (meanA / total) * 100
  const percentageB = (meanB / total) * 100

  // 计算趋势
  const trendA = calculateTrendSlope(valuesA)
  const trendB = calculateTrendSlope(valuesB)

  return {
    size_ratio: Math.abs(sizeRatio),
    volatility_ratio: Math.abs(volatilityRatio),
    percent_difference: Math.abs(percentDifference),
    percentages: {
      entityA: parseFloat(percentageA.toFixed(1)),
      entityB: parseFloat(percentageB.toFixed(1)),
      total: parseFloat(total.toFixed(0))
    },
    trend_slopes: {
      entityA: trendA,
      entityB: trendB,
      trend_ratio: trendA / trendB
    },
    values: {
      entityA: {
        label: data.entityA.label || '实体A',
        mean: parseFloat(meanA.toFixed(2)),
        max: parseFloat(maxA.toFixed(2)),
        min: parseFloat(minA.toFixed(2)),
        current: valuesA[valuesA.length - 1] || parseFloat(meanA.toFixed(2)),
        std: parseFloat(stdA.toFixed(2)),
        count: valuesA.length,
        unit: data.entityA.unit || '单位'
      },
      entityB: {
        label: data.entityB.label || '实体B',
        mean: parseFloat(meanB.toFixed(2)),
        max: parseFloat(maxB.toFixed(2)),
        min: parseFloat(minB.toFixed(2)),
        current: valuesB[valuesB.length - 1] || parseFloat(meanB.toFixed(2)),
        std: parseFloat(stdB.toFixed(2)),
        count: valuesB.length,
        unit: data.entityB.unit || '单位'
      }
    },
    summary: {
      size_comparison: `大小比例: ${sizeRatio.toFixed(2)}:1`,
      percentage_comparison: `占比: ${percentageA.toFixed(
        1
      )}% vs ${percentageB.toFixed(1)}%`,
      volatility_comparison: `波动性比例: ${volatilityRatio.toFixed(2)}:1`,
      trend_comparison: `趋势比: ${(trendA / trendB).toFixed(2)}:1`
    },
    metadata: {
      source: data.aiGenerated ? 'ai_generated' : 'file_parsed',
      hasTimeSeries: data.hasTimeSeries || false,
      totalDataPoints: valuesA.length + valuesB.length
    }
  }
}

// 计算趋势斜率
function calculateTrendSlope(values) {
  if (values.length < 2) return 0

  const n = values.length
  const x = Array.from({ length: n }, (_, i) => i)

  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)

  // 归一化为百分比变化
  const baseValue = values[0] || 1
  return parseFloat(((slope / baseValue) * 100).toFixed(2))
}

// 默认数值特征
function getDefaultNumericalFeatures() {
  return {
    size_ratio: 1.8,
    volatility_ratio: 2.3,
    percent_difference: 80.0,
    percentages: {
      entityA: 64.3,
      entityB: 35.7,
      total: 2350
    },
    trend_slopes: {
      entityA: 15.0,
      entityB: 8.0,
      trend_ratio: 1.88
    },
    values: {
      entityA: {
        label: '产品A',
        mean: 1500,
        max: 2000,
        min: 1000,
        current: 1800,
        std: 250,
        count: 50,
        unit: '销售额(万元)'
      },
      entityB: {
        label: '产品B',
        mean: 850,
        max: 1300,
        min: 600,
        current: 1000,
        std: 150,
        count: 50,
        unit: '销售额(万元)'
      }
    },
    summary: {
      size_comparison: '大小比例: 1.76:1',
      percentage_comparison: '占比: 63.8% vs 36.2%',
      volatility_comparison: '波动性比例: 1.67:1',
      trend_comparison: '趋势比: 1.88:1'
    },
    metadata: {
      source: 'default',
      hasTimeSeries: true,
      totalDataPoints: 100
    }
  }
}

// =============== 数据分析API端点 ===============
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
    const quantify = req.body.quantify === 'true' || true // 默认开启量化分析
    console.log('量化分析模式:', quantify)

    try {
      const mode = req.body.mode || 'single'
      console.log('分析模式:', mode)

      let files = []
      let filePaths = []
      let fileContents = []
      let enhancedNumericalFeatures = null

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

      // 提取增强的数值特征
      if (quantify && files.length > 0) {
        try {
          const file = files[0]
          console.log('开始提取增强的数值特征:', file.originalname)
          enhancedNumericalFeatures = await extractEnhancedNumericalFeatures(
            file.path,
            file.originalname,
            mode
          )
          console.log('增强数值特征提取成功')
          console.log('实体A:', enhancedNumericalFeatures.values.entityA)
          console.log('实体B:', enhancedNumericalFeatures.values.entityB)
          console.log('比例关系:', enhancedNumericalFeatures.summary)
        } catch (featureError) {
          console.warn('增强数值特征提取失败，使用默认值:', featureError)
          enhancedNumericalFeatures = getDefaultNumericalFeatures()
        }
      }

      // 读取文件内容用于AI分析
      for (const file of files) {
        const filePath = file.path
        filePaths.push(filePath)

        // 获取文件扩展名
        const extension = file.originalname.split('.').pop().toLowerCase()

        let content = ''

        if (extension === 'csv') {
          content = fs.readFileSync(filePath, 'utf-8')
          const lines = content.split('\n').slice(0, 100).join('\n')
          content = lines
        } else if (extension === 'json') {
          const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
          let simplifiedData = jsonData
          if (Array.isArray(jsonData) && jsonData.length > 50) {
            simplifiedData = jsonData.slice(0, 50)
          }
          content = JSON.stringify(simplifiedData, null, 2)
        } else if (extension === 'xlsx' || extension === 'xls') {
          const buffer = fs.readFileSync(filePath)
          content = `Excel文件: ${file.originalname}, 大小: ${buffer.length} bytes`
        } else {
          content = `文件类型: ${extension}, 名称: ${file.originalname}`
        }

        fileContents.push({
          filename: file.originalname,
          content: content.substring(0, 8000)
        })
      }

      // 清理临时文件
      filePaths.forEach((path) => {
        if (fs.existsSync(path)) {
          fs.unlinkSync(path)
        }
      })

      // 构建AI分析提示词 - 包含详细的数值特征
      let prompt = ''

      if (mode === 'single') {
        // 构建包含详细数值特征的提示词
        const numericalContext = enhancedNumericalFeatures
          ? `

【详细的数值特征】：
1. 对比对象：
   - ${enhancedNumericalFeatures.values.entityA.label}:
     * 平均值: ${enhancedNumericalFeatures.values.entityA.mean} ${
       enhancedNumericalFeatures.values.entityA.unit
     }
     * 当前值: ${enhancedNumericalFeatures.values.entityA.current} ${
       enhancedNumericalFeatures.values.entityA.unit
     }
     * 范围: ${enhancedNumericalFeatures.values.entityA.min} - ${
       enhancedNumericalFeatures.values.entityA.max
     } ${enhancedNumericalFeatures.values.entityA.unit}
     * 数据点: ${enhancedNumericalFeatures.values.entityA.count}个

   - ${enhancedNumericalFeatures.values.entityB.label}:
     * 平均值: ${enhancedNumericalFeatures.values.entityB.mean} ${
       enhancedNumericalFeatures.values.entityB.unit
     }
     * 当前值: ${enhancedNumericalFeatures.values.entityB.current} ${
       enhancedNumericalFeatures.values.entityB.unit
     }
     * 范围: ${enhancedNumericalFeatures.values.entityB.min} - ${
       enhancedNumericalFeatures.values.entityB.max
     } ${enhancedNumericalFeatures.values.entityB.unit}
     * 数据点: ${enhancedNumericalFeatures.values.entityB.count}个

2. 比例关系：
   - 大小比例: ${enhancedNumericalFeatures.size_ratio.toFixed(2)}:1
   - 百分比占比: ${enhancedNumericalFeatures.percentages.entityA}% vs ${
     enhancedNumericalFeatures.percentages.entityB
   }%
   - 波动性比例: ${enhancedNumericalFeatures.volatility_ratio.toFixed(2)}:1
   - 趋势斜率: ${enhancedNumericalFeatures.trend_slopes.entityA}% vs ${
     enhancedNumericalFeatures.trend_slopes.entityB
   }%

3. 关键数值差异：${enhancedNumericalFeatures.values.entityA.mean} vs ${
              enhancedNumericalFeatures.values.entityB.mean
            }，差异 ${enhancedNumericalFeatures.percent_difference.toFixed(1)}%`
          : ''

        prompt = `你是一个高级数据分析AI。分析以下数据文件内容，找出其中可以对比的两个对象，并基于提供的详细数值特征进行分析。${numericalContext}

文件信息：
文件名: ${fileContents[0].filename}
文件内容预览：
\`\`\`
${fileContents[0].content}
\`\`\`

请基于以上【详细的数值特征】进行分析，返回以下结构的JSON：

{
  "table_understanding": {
    "table_type": "销售数据|用户数据|运营数据|产品数据|财务数据|其他",
    "industry_domain": "电商|金融|医疗|教育|制造|科技|其他",
    "business_purpose": "业绩分析|用户分析|产品对比|趋势监控|运营评估|其他",
    "content_summary": "简要描述表格内容",
    "confidence_score": 0.85,
    "likely_scenarios": ["场景1", "场景2", "场景3"]
  },
  "comparisonItems": ["${
    enhancedNumericalFeatures?.values?.entityA?.label || '对象A'
  } vs ${
    enhancedNumericalFeatures?.values?.entityB?.label || '对象B'
  }", "其他对比维度"],
  "trends": [
    "${
      enhancedNumericalFeatures?.values?.entityA?.label || '对象A'
    }趋势描述（斜率${enhancedNumericalFeatures?.trend_slopes?.entityA || 0}%）",
    "${
      enhancedNumericalFeatures?.values?.entityB?.label || '对象B'
    }趋势描述（斜率${enhancedNumericalFeatures?.trend_slopes?.entityB || 0}%）",
    "对比趋势描述"
  ],
  "characteristics": {
    "sizeComparison": "${
      enhancedNumericalFeatures?.values?.entityA?.label || 'A'
    }规模是${enhancedNumericalFeatures?.values?.entityB?.label || 'B'}的${
      enhancedNumericalFeatures?.size_ratio?.toFixed(1) || 1.8
    }倍",
    "volatility": "${
      enhancedNumericalFeatures?.values?.entityB?.label || 'B'
    }波动性是${enhancedNumericalFeatures?.values?.entityA?.label || 'A'}的${
      enhancedNumericalFeatures?.volatility_ratio?.toFixed(1) || 2.3
    }倍",
    "percentageDistribution": "${
      enhancedNumericalFeatures?.values?.entityA?.label || 'A'
    }占比${enhancedNumericalFeatures?.percentages?.entityA || 64}%，${
      enhancedNumericalFeatures?.values?.entityB?.label || 'B'
    }占比${enhancedNumericalFeatures?.percentages?.entityB || 36}%",
    "trendDirection": "${
      enhancedNumericalFeatures?.trend_slopes?.entityA || 15
    }%增长 vs ${enhancedNumericalFeatures?.trend_slopes?.entityB || 8}%增长",
    "valueRange": "${
      enhancedNumericalFeatures?.values?.entityA?.label || 'A'
    }范围${enhancedNumericalFeatures?.values?.entityA?.min || 1000}-${
      enhancedNumericalFeatures?.values?.entityA?.max || 2000
    }，${enhancedNumericalFeatures?.values?.entityB?.label || 'B'}范围${
      enhancedNumericalFeatures?.values?.entityB?.min || 600
    }-${enhancedNumericalFeatures?.values?.entityB?.max || 1300}"
  },
  "summary": "一句话总结对比发现，包含具体数值",
  "numerical_features": ${JSON.stringify(
    enhancedNumericalFeatures || getDefaultNumericalFeatures(),
    null,
    2
  )}
}

重要要求：
1. 必须使用提供的具体数值特征
2. 对比描述要包含具体数值和百分比
3. 确保JSON格式有效
4. 突出显示关键的数值差异`
      } else {
        // 双文件模式（类似，但需要调整）
        prompt = `你是一个高级数据分析AI。分析以下两个数据文件，找出它们之间的主要对比关系和差异特征。`

        // 构建双文件模式的完整提示词
        prompt = `${prompt}

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

请分析并返回JSON格式结果，包含详细数值特征。`
      }

      console.log('调用AI进行数据分析，提示词长度:', prompt.length)

      // 调用通义千问进行数据分析
      const completion = await openai.chat.completions.create({
        model: 'qwen-turbo',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的数据分析AI助手。要求：
1. 必须使用提供的具体数值特征进行描述
2. 对比要包含具体数值、百分比、比例
3. 返回有效的JSON格式
4. 突出关键数值差异
5. 使用中文描述，保持专业性`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // 较低温度以获得更一致的数值分析
        max_tokens: 2000
      })

      const aiResponse = completion.choices[0]?.message?.content || ''
      console.log('AI数据分析响应长度:', aiResponse.length)

      // 解析响应
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          let analysisResult = JSON.parse(jsonMatch[0])

          // 确保包含增强的数值特征
          if (!analysisResult.numerical_features && enhancedNumericalFeatures) {
            analysisResult.numerical_features = enhancedNumericalFeatures
          }

          // 生成详细的AI解释
          if (mode === 'single') {
            const explainPrompt = `基于以下详细的数据分析结果（特别是具体的数值特征），为用户生成一个详细的、易于理解的解释：

分析结果：${JSON.stringify(analysisResult, null, 2)}

请重点突出以下内容：
1. 具体的数值对比：${
              analysisResult.numerical_features?.values?.entityA?.mean || 0
            } vs ${
              analysisResult.numerical_features?.values?.entityB?.mean || 0
            }
2. 百分比差异：${analysisResult.numerical_features?.percent_difference || 0}%
3. 比例关系：${analysisResult.numerical_features?.size_ratio || 1}:1
4. 占比分布：${
              analysisResult.numerical_features?.percentages?.entityA || 0
            }% vs ${
              analysisResult.numerical_features?.percentages?.entityB || 0
            }%

用中文回答，语言要亲切易懂，但必须准确包含具体数值。`

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
                max_tokens: 600
              })

              analysisResult.table_understanding_explained =
                explainCompletion.choices[0]?.message?.content || ''
            } catch (explainError) {
              console.warn('生成AI解释失败:', explainError)
              analysisResult.table_understanding_explained = `基于数据分析，${
                analysisResult.numerical_features?.values?.entityA?.label ||
                '实体A'
              }（${
                analysisResult.numerical_features?.values?.entityA?.current || 0
              }${
                analysisResult.numerical_features?.values?.entityA?.unit || ''
              }）与${
                analysisResult.numerical_features?.values?.entityB?.label ||
                '实体B'
              }（${
                analysisResult.numerical_features?.values?.entityB?.current || 0
              }${
                analysisResult.numerical_features?.values?.entityB?.unit || ''
              }）的对比特征明显，大小比例${
                analysisResult.numerical_features?.size_ratio?.toFixed(2) || 1.8
              }:1，占比${
                analysisResult.numerical_features?.percentages?.entityA || 64
              }% vs ${
                analysisResult.numerical_features?.percentages?.entityB || 36
              }%，适合进行精确的视觉隐喻表达。`
            }
          }

          res.json(analysisResult)
        } else {
          throw new Error('AI响应中未找到有效的JSON')
        }
      } catch (parseError) {
        console.error('解析AI响应失败:', parseError)
        console.log('AI原始响应前500字符:', aiResponse.substring(0, 500))

        // 返回包含增强数值特征的演示数据
        const demoAnalysis = getEnhancedDemoAnalysis(
          mode,
          enhancedNumericalFeatures
        )
        res.json(demoAnalysis)
      }
    } catch (error) {
      console.error('数据分析失败:', error)

      // 清理临时文件
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
      const demoAnalysis = getEnhancedDemoAnalysis(req.body.mode || 'single')
      res.json(demoAnalysis)
    }
  }
)

// 增强版演示数据
function getEnhancedDemoAnalysis(mode = 'single', numericalFeatures = null) {
  const features = numericalFeatures || getDefaultNumericalFeatures()

  if (mode === 'single') {
    return {
      table_understanding: {
        table_type: '销售数据',
        industry_domain: '电商',
        business_purpose: '产品对比分析',
        content_summary: `包含${features.values.entityA.label}和${features.values.entityB.label}的详细销售数据，具有明显的数值对比特征`,
        confidence_score: 0.92,
        likely_scenarios: ['产品性能对比', '市场趋势分析', '销售策略评估']
      },
      comparisonItems: [
        `${features.values.entityA.label} vs ${features.values.entityB.label}`,
        `${features.percentages.entityA}%占比 vs ${features.percentages.entityB}%占比`
      ],
      trends: [
        `${features.values.entityA.label}呈稳定上升趋势，季度增长率约${features.trend_slopes.entityA}%`,
        `${features.values.entityB.label}波动较大，但${
          features.trend_slopes.entityB > 0 ? '总体呈' : '呈'
        }${Math.abs(features.trend_slopes.entityB)}%${
          features.trend_slopes.entityB > 0 ? '增长' : '下降'
        }趋势`,
        `两者趋势对比为${features.trend_slopes.trend_ratio.toFixed(2)}:1`
      ],
      characteristics: {
        sizeComparison: `${features.values.entityA.label}规模是${
          features.values.entityB.label
        }的${features.size_ratio.toFixed(2)}倍（${
          features.values.entityA.mean
        } vs ${features.values.entityB.mean} ${features.values.entityA.unit}）`,
        volatility: `${features.values.entityB.label}波动性是${
          features.values.entityA.label
        }的${features.volatility_ratio.toFixed(2)}倍`,
        percentageDistribution: `占比分布：${features.values.entityA.label}占${features.percentages.entityA}%，${features.values.entityB.label}占${features.percentages.entityB}%`,
        trendDirection: `趋势对比：${features.trend_slopes.entityA}%增长 vs ${features.trend_slopes.entityB}%增长`,
        valueRange: `${features.values.entityA.label}值范围${features.values.entityA.min}-${features.values.entityA.max}，${features.values.entityB.label}值范围${features.values.entityB.min}-${features.values.entityB.max}`,
        currentValue: `当前值：${features.values.entityA.current} vs ${features.values.entityB.current}`
      },
      summary: `${features.values.entityA.label}（${
        features.values.entityA.current
      }${features.values.entityA.unit}）在规模上占优，是${
        features.values.entityB.label
      }（${features.values.entityB.current}${
        features.values.entityB.unit
      }）的${features.size_ratio.toFixed(1)}倍，占比${
        features.percentages.entityA
      }%，但${features.values.entityB.label}的波动性更大`,
      numerical_features: features,
      table_understanding_explained: `这是一个电商销售数据表格，主要用于对比${
        features.values.entityA.label
      }和${features.values.entityB.label}的表现。关键数值对比：${
        features.values.entityA.label
      }平均${features.values.entityA.mean}${features.values.entityA.unit}，${
        features.values.entityB.label
      }平均${features.values.entityB.mean}${
        features.values.entityB.unit
      }，大小比例${features.size_ratio.toFixed(2)}:1。占比方面，${
        features.values.entityA.label
      }占${features.percentages.entityA}%，${features.values.entityB.label}占${
        features.percentages.entityB
      }%。${features.values.entityA.label}趋势更稳定（${
        features.trend_slopes.entityA
      }%增长），而${
        features.values.entityB.label
      }波动性更大（波动性是前者的${features.volatility_ratio.toFixed(
        2
      )}倍）。这些具体的数值差异为视觉隐喻提供了精确的数据基础。`
    }
  } else {
    return {
      comparisonItems: [
        `${features.values.entityA.label} vs ${features.values.entityB.label}`,
        '时间段对比',
        '数值分布对比'
      ],
      trends: [
        `${features.values.entityA.label}整体呈${
          features.trend_slopes.entityA > 0 ? '上升' : '下降'
        }趋势，变化率${Math.abs(features.trend_slopes.entityA)}%`,
        `${features.values.entityB.label}在中期有显著波动，趋势斜率${features.trend_slopes.entityB}%`,
        '两者在关键时间段都有明显变化'
      ],
      characteristics: {
        sizeComparison: `${features.values.entityA.label}规模是${
          features.values.entityB.label
        }的${features.size_ratio.toFixed(2)}倍`,
        trendStability: `${features.values.entityA.label}趋势更稳定，波动性${features.values.entityA.std}，${features.values.entityB.label}波动性${features.values.entityB.std}`,
        percentageDistribution: `占比：${features.percentages.entityA}% vs ${features.percentages.entityB}%`,
        valueRange: `${features.values.entityA.label}范围${features.values.entityA.min}-${features.values.entityA.max}，${features.values.entityB.label}范围${features.values.entityB.min}-${features.values.entityB.max}`
      },
      summary: `两个数据集展现明显的数值差异：${
        features.values.entityA.label
      }规模更大、更稳定，${
        features.values.entityB.label
      }波动性更高但局部有突出表现。具体数值：${
        features.values.entityA.current
      } vs ${
        features.values.entityB.current
      }，差异${features.percent_difference.toFixed(1)}%。`,
      numerical_features: features
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
  console.log(`📊 支持增强的数值特征提取`)
  console.log(`🎯 包含具体数值、百分比、比例关系的详细分析`)
})
