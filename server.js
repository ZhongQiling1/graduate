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
            '你是一位精通数据分析和概念隐喻的数据科学家，擅长生成详细的数据对比分析报告。在生成隐喻时，请根据数据类型选择合适的喻体，避免单一使用金币，要做到喻体的泛化和多样化。'
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

// =============== 新增：智能行业识别和实体关键词提取 ===============

// 智能识别行业领域
async function detectIndustryIntelligently(
  fileContent,
  filename,
  numericalFeatures
) {
  try {
    // 如果已经有行业信息，直接使用
    if (
      fileContent.includes('销售') ||
      fileContent.includes('营收') ||
      fileContent.includes('收入')
    ) {
      return '电商/零售'
    } else if (
      fileContent.includes('用户') ||
      fileContent.includes('客户') ||
      fileContent.includes('会员')
    ) {
      return '互联网/用户增长'
    } else if (
      fileContent.includes('财务') ||
      fileContent.includes('利润') ||
      fileContent.includes('成本')
    ) {
      return '金融/财务'
    } else if (
      fileContent.includes('医疗') ||
      fileContent.includes('健康') ||
      fileContent.includes('患者')
    ) {
      return '医疗健康'
    } else if (
      fileContent.includes('教育') ||
      fileContent.includes('学生') ||
      fileContent.includes('课程')
    ) {
      return '教育'
    } else if (
      fileContent.includes('鸢尾花') ||
      fileContent.includes('花瓣') ||
      fileContent.includes('花萼') ||
      fileContent.includes('sepal') ||
      fileContent.includes('petal')
    ) {
      return '生物/植物学'
    } else if (
      fileContent.includes('科技') ||
      fileContent.includes('研发') ||
      fileContent.includes('专利') ||
      fileContent.includes('技术')
    ) {
      return '科技/研发'
    }

    // 使用AI进行智能识别
    const prompt = `请根据以下数据内容，智能识别所属的行业领域，并提取关键实体：

文件: ${filename}
数据预览:
\`\`\`
${fileContent.substring(0, 3000)}
\`\`\`

数值特征:
- 对比对象A: ${numericalFeatures?.values?.entityA?.label || '未知'} (${
      numericalFeatures?.values?.entityA?.mean || 0
    } ${numericalFeatures?.values?.entityA?.unit || ''})
- 对比对象B: ${numericalFeatures?.values?.entityB?.label || '未知'} (${
      numericalFeatures?.values?.entityB?.mean || 0
    } ${numericalFeatures?.values?.entityB?.unit || ''})
- 规模比例: ${numericalFeatures?.size_ratio || 1}:1

请返回JSON格式：
{
  "industry": "电商|金融|医疗|教育|科技|制造|零售|生物|植物学|其他",
  "industry_details": {
    "main_category": "主要分类",
    "sub_category": "子分类",
    "confidence": 0.85
  },
  "entity_keywords": {
    "primary_object": "最合适的核心物体（根据数据类型选择，禁止默认使用金币）",
    "secondary_objects": ["相关物体1", "相关物体2"],
    "colors": {
      "warm": ["暖色1", "暖色2"],
      "cool": ["冷色1", "冷色2"]
    },
    "entityA_synonyms": ["同义词1", "同义词2"],
    "entityB_synonyms": ["同义词1", "同义词2"]
  },
  "metaphor_suggestions": {
    "physical_collections": "适合实体隐喻的物体",
    "construction_progress": "适合结构隐喻的物体",
    "density_distribution": "适合方位隐喻的物体"
  }
}

重要要求：
1. 行业识别要准确，基于数据内容和数值特征
2. 实体关键词要具体、可视觉化，且必须根据数据类型选择合适的喻体：
   - 生物/植物数据（如鸢尾花）：使用花瓣、叶片、种子、花粉、茎秆等
   - 教育数据：使用书籍、毕业帽、铅笔、书本、教室、学位证书等
   - 科技数据：使用芯片、电路板、数据流、服务器、代码行、算法节点等
   - 金融数据：可使用金币但也可选择账单、交易单、资产包等
   - 医疗数据：使用药片、心电图、细胞、DNA链、医疗设备等
   - 环境数据：使用树叶、水滴、空气质量指数、温度刻度等
3. 严禁所有数据类型都默认使用金币作为喻体
4. 颜色方案要符合行业特征
5. 确保每个行业都有其独特的、贴合的喻体体系`

    const completion = await openai.chat.completions.create({
      model: 'qwen-turbo',
      messages: [
        {
          role: 'system',
          content:
            '你是一个数据分析专家，擅长识别数据所属的行业领域，并为视觉化提取合适的实体关键词。必须严格遵守喻体选择规则，避免单一使用金币，确保喻体的泛化和多样性。'
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
        return JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.log('AI行业识别解析失败，使用默认值')
    }
  } catch (error) {
    console.error('AI行业识别失败:', error)
  }

  // 修改默认值：根据文件名智能选择默认喻体
  let defaultObject = '金币'
  if (
    filename.includes('鸢尾花') ||
    filename.includes('花') ||
    filename.includes('plant')
  ) {
    defaultObject = '花瓣'
  } else if (
    filename.includes('教育') ||
    filename.includes('学习') ||
    filename.includes('student')
  ) {
    defaultObject = '书籍'
  } else if (
    filename.includes('科技') ||
    filename.includes('研发') ||
    filename.includes('tech')
  ) {
    defaultObject = '芯片'
  } else if (
    filename.includes('医疗') ||
    filename.includes('健康') ||
    filename.includes('medical')
  ) {
    defaultObject = '药片'
  }

  // 默认值
  return {
    industry: '电商/零售',
    industry_details: {
      main_category: '商业',
      sub_category: '电商零售',
      confidence: 0.8
    },
    entity_keywords: {
      primary_object: defaultObject,
      secondary_objects:
        defaultObject === '金币'
          ? ['商品', '包裹', '购物车']
          : defaultObject === '花瓣'
            ? ['叶片', '花萼', '种子']
            : defaultObject === '书籍'
              ? ['铅笔', '毕业帽', '教室']
              : defaultObject === '芯片'
                ? ['电路板', '数据流', '服务器']
                : ['药片', '心电图', '医疗设备'],
      colors: {
        warm: ['橙色', '红色', '黄色'],
        cool: ['蓝色', '绿色', '紫色']
      },
      entityA_synonyms: ['产品A', 'A类', '主要产品'],
      entityB_synonyms: ['产品B', 'B类', '次要产品']
    },
    metaphor_suggestions: {
      physical_collections:
        defaultObject === '金币'
          ? '金币堆'
          : defaultObject === '花瓣'
            ? '花瓣簇'
            : defaultObject === '书籍'
              ? '书籍堆'
              : defaultObject === '芯片'
                ? '芯片阵列'
                : '药片堆',
      construction_progress:
        defaultObject === '金币'
          ? '仓库建设'
          : defaultObject === '花瓣'
            ? '花朵生长'
            : defaultObject === '书籍'
              ? '知识构建'
              : defaultObject === '芯片'
                ? '技术架构'
                : '医疗设施建设',
      density_distribution:
        defaultObject === '金币'
          ? '订单分布点'
          : defaultObject === '花瓣'
            ? '花粉分布'
            : defaultObject === '书籍'
              ? '学生分布'
              : defaultObject === '芯片'
                ? '数据节点分布'
                : '患者分布'
    }
  }
}

// 根据行业和隐喻类型选择具体物体
// 修改selectMetaphorObjectsByIndustry函数中的switch语句
function selectMetaphorObjectsByIndustry(
  industryInfo,
  metaphorType,
  numericalFeatures
) {
  const { industry, entity_keywords, metaphor_suggestions } = industryInfo

  // 根据隐喻类型选择物体
  let primaryObject = ''
  let colorScheme = {
    warm: ['橙色', '红色'],
    cool: ['蓝色', '绿色']
  }

  // 根据行业定制颜色和喻体
  switch (industry) {
    case '生物/植物学':
      colorScheme = {
        warm: ['粉色', '黄色', '橙色'],
        cool: ['绿色', '紫色', '蓝色']
      }
      break
    case '教育':
      colorScheme = {
        warm: ['棕色', '红色', '橙色'],
        cool: ['蓝色', '绿色', '紫色']
      }
      break
    case '科技/研发':
      colorScheme = {
        warm: ['红色', '橙色', '黄色'],
        cool: ['深蓝色', '青色', '紫色']
      }
      break
    case '医疗健康':
      colorScheme = {
        warm: ['红色', '粉色', '橙色'],
        cool: ['蓝色', '绿色', '白色']
      }
      break
    case '金融/财务':
      colorScheme = {
        warm: ['金色', '黄色', '橙色'],
        cool: ['绿色', '蓝色', '紫色']
      }
      break
  }

  switch (metaphorType) {
    case 'physical_collections': {
      primaryObject =
        metaphor_suggestions.physical_collections ||
        entity_keywords.primary_object
      // 根据规模比例调整描述
      if (numericalFeatures?.size_ratio > 2) {
        primaryObject = `大型${primaryObject}`
      } else if (numericalFeatures?.size_ratio < 0.5) {
        primaryObject = `小型${primaryObject}`
      }
      break
    }

    case 'construction_progress': {
      primaryObject = metaphor_suggestions.construction_progress || '建筑'
      // 根据趋势斜率调整
      const slopeA = numericalFeatures?.trend_slopes?.entityA || 0
      const slopeB = numericalFeatures?.trend_slopes?.entityB || 0
      if (slopeA > slopeB * 1.5) {
        primaryObject = `快速建造的${primaryObject}`
      } else if (slopeB > slopeA * 1.5) {
        primaryObject = `稳步建造的${primaryObject}`
      }
      break
    }

    case 'density_distribution': {
      primaryObject = metaphor_suggestions.density_distribution || '点'
      // 根据密度调整
      if (numericalFeatures?.size_ratio > 1.5) {
        primaryObject = `密集${primaryObject}`
      } else {
        primaryObject = `分布${primaryObject}`
      }
      break
    }
  }

  return {
    primaryObject,
    colorScheme: entity_keywords.colors || colorScheme,
    industry: industry,
    entitySynonyms: {
      entityA: entity_keywords.entityA_synonyms || [],
      entityB: entity_keywords.entityB_synonyms || []
    }
  }
}

// =============== 数据分析API端点 ===============
// =============== 修改数据分析API端点 ===============
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
    const quantify = req.body.quantify === 'true' || true
    console.log('量化分析模式:', quantify)

    try {
      const mode = req.body.mode || 'single'
      console.log('分析模式:', mode)

      let files = []
      let filePaths = []
      let fileContents = []
      let enhancedNumericalFeatures = null
      let industryInfo = null
      let metaphorObjects = null

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
          console.log('实体A:', enhancedNumericalFeatures?.values?.entityA)
          console.log('实体B:', enhancedNumericalFeatures?.values?.entityB)
          console.log('比例关系:', enhancedNumericalFeatures?.summary)
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

      // 智能行业识别和实体提取
      if (fileContents.length > 0 && enhancedNumericalFeatures) {
        try {
          console.log('开始智能行业识别...')
          industryInfo = await detectIndustryIntelligently(
            fileContents[0].content,
            fileContents[0].filename,
            enhancedNumericalFeatures
          )
          console.log('行业识别结果:', industryInfo.industry)

          // 为每种隐喻类型预选物体（供前端使用）
          metaphorObjects = {
            physical_collections: selectMetaphorObjectsByIndustry(
              industryInfo,
              'physical_collections',
              enhancedNumericalFeatures
            ),
            construction_progress: selectMetaphorObjectsByIndustry(
              industryInfo,
              'construction_progress',
              enhancedNumericalFeatures
            ),
            density_distribution: selectMetaphorObjectsByIndustry(
              industryInfo,
              'density_distribution',
              enhancedNumericalFeatures
            )
          }
          console.log('隐喻物体选择完成')
        } catch (industryError) {
          console.warn('行业识别失败:', industryError)
          // 使用默认行业信息
          industryInfo = {
            industry: '电商/零售',
            industry_details: {
              main_category: '商业',
              sub_category: '电商零售',
              confidence: 0.8
            },
            entity_keywords: {
              primary_object: '金币',
              secondary_objects: ['商品', '包裹', '购物车'],
              colors: {
                warm: ['橙色', '红色', '黄色'],
                cool: ['蓝色', '绿色', '紫色']
              },
              entityA_synonyms: ['产品A', 'A类', '主要产品'],
              entityB_synonyms: ['产品B', 'B类', '次要产品']
            }
          }
        }
      }

      // 清理临时文件
      // filePaths.forEach((path) => {
      //   if (fs.existsSync(path)) {
      //     fs.unlinkSync(path)
      //   }
      // })

      // 构建AI分析提示词 - 根据模式不同构建不同的提示词
      let prompt = ''

      if (mode === 'single') {
        // 单文件模式提示词（保持你原来的逻辑）
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

3. 行业背景：
   - 识别行业: ${industryInfo?.industry || '电商/零售'}
   - 核心实体: ${industryInfo?.entity_keywords?.primary_object || '金币'}
   - 相关元素: ${JSON.stringify(
     industryInfo?.entity_keywords?.secondary_objects || ['商品', '订单']
   )}
   - 暖色调: ${JSON.stringify(
     industryInfo?.entity_keywords?.colors?.warm || ['橙色', '红色']
   )}
   - 冷色调: ${JSON.stringify(
     industryInfo?.entity_keywords?.colors?.cool || ['蓝色', '绿色']
   )}

4. 关键数值差异：${enhancedNumericalFeatures.values.entityA.mean} vs ${
              enhancedNumericalFeatures.values.entityB.mean
            }，差异 ${enhancedNumericalFeatures.percent_difference.toFixed(1)}%`
          : ''

        prompt = `你是一个高级数据分析AI。分析以下数据文件内容，找出其中可以对比的两个对象，并基于提供的详细数值特征和行业背景进行分析。${numericalContext}

文件信息：
文件名: ${fileContents[0].filename}
文件内容预览：
\`\`\`
${fileContents[0].content}
\`\`\`

请基于以上【详细的数值特征】和【行业背景】进行分析，返回以下结构的JSON：

{
  "table_understanding": {
    "table_type": "销售数据|用户数据|运营数据|产品数据|财务数据|生物数据|教育数据|科技数据|其他",
    "industry_domain": "电商|金融|医疗|教育|制造|科技|生物|植物学|其他",
    "business_purpose": "业绩分析|用户分析|产品对比|趋势监控|运营评估|科学研究|教育评估|其他",
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
  )},
  "industry_analysis": {
    "detected_industry": "${industryInfo?.industry || '电商/零售'}",
    "industry_confidence": ${industryInfo?.industry_details?.confidence || 0.8},
    "main_category": "${
      industryInfo?.industry_details?.main_category || '商业'
    }",
    "sub_category": "${
      industryInfo?.industry_details?.sub_category || '电商零售'
    }",
    "suggested_metaphor_objects": ${JSON.stringify(
      metaphorObjects || {
        physical_collections: {
          primaryObject: '金币堆',
          colorScheme: { warm: ['橙色', '红色'], cool: ['蓝色', '绿色'] },
          industry: '电商/零售',
          entitySynonyms: {
            entityA: ['产品A', 'A类'],
            entityB: ['产品B', 'B类']
          }
        },
        construction_progress: {
          primaryObject: '仓库建设',
          colorScheme: { warm: ['棕色', '黄色'], cool: ['灰色', '银色'] },
          industry: '电商/零售',
          entitySynonyms: {
            entityA: ['产品A', 'A类'],
            entityB: ['产品B', 'B类']
          }
        },
        density_distribution: {
          primaryObject: '订单分布点',
          colorScheme: { warm: ['红色', '橙色'], cool: ['蓝色', '紫色'] },
          industry: '电商/零售',
          entitySynonyms: {
            entityA: ['产品A', 'A类'],
            entityB: ['产品B', 'B类']
          }
        }
      }
    )},
    "entity_keywords": {
      "primary_object": "${
        industryInfo?.entity_keywords?.primary_object || '金币'
      }",
      "secondary_objects": ${JSON.stringify(
        industryInfo?.entity_keywords?.secondary_objects || ['商品', '订单']
      )},
      "colors": {
        "warm": ${JSON.stringify(
          industryInfo?.entity_keywords?.colors?.warm || ['橙色', '红色']
        )},
        "cool": ${JSON.stringify(
          industryInfo?.entity_keywords?.colors?.cool || ['蓝色', '绿色']
        )}
      },
      "entityA_synonyms": ${JSON.stringify(
        industryInfo?.entity_keywords?.entityA_synonyms || [
          '产品A',
          'A类',
          '主要产品'
        ]
      )},
      "entityB_synonyms": ${JSON.stringify(
        industryInfo?.entity_keywords?.entityB_synonyms || [
          '产品B',
          'B类',
          '次要产品'
        ]
      )}
    }
  },
  "analysis_mode": "single"
}`
        // =============== 修改双文件模式的数据分析部分 ===============
      } else {
        // 双文件模式 - 分别分析每个文件，然后对比
        console.log(
          '双文件模式分析，文件A:',
          fileContents[0].filename,
          '文件B:',
          fileContents[1].filename
        )

        // 分别为两个文件提取特征和分析
        let fileAAnalysis = null
        let fileBAnalysis = null

        try {
          // 分析文件A
          if (files[0]) {
            const fileAFeatures = await extractEnhancedNumericalFeatures(
              files[0].path,
              files[0].originalname,
              'single'
            )
            // 获取文件A的行业信息
            const industryInfoA = await detectIndustryIntelligently(
              fileContents[0].content,
              fileContents[0].filename,
              fileAFeatures
            )

            fileAAnalysis = {
              filename: fileContents[0].filename,
              features: fileAFeatures,
              industry: industryInfoA,
              primaryObject: fileAFeatures?.values?.entityA?.label || '对象A',
              secondaryObject: fileAFeatures?.values?.entityB?.label || '对象B'
            }
          }

          // 分析文件B
          if (files[1]) {
            const fileBFeatures = await extractEnhancedNumericalFeatures(
              files[1].path,
              files[1].originalname,
              'single'
            )
            // 获取文件B的行业信息
            const industryInfoB = await detectIndustryIntelligently(
              fileContents[1].content,
              fileContents[1].filename,
              fileBFeatures
            )

            fileBAnalysis = {
              filename: fileContents[1].filename,
              features: fileBFeatures,
              industry: industryInfoB,
              primaryObject: fileBFeatures?.values?.entityA?.label || '对象C',
              secondaryObject: fileBFeatures?.values?.entityB?.label || '对象D'
            }
          }
        } catch (error) {
          console.warn('文件单独分析失败:', error)
        }

        // 确定对比对象：优先对比两个文件的primaryObject
        const objectA = fileAAnalysis?.primaryObject || '数据集A'
        const objectB = fileBAnalysis?.primaryObject || '数据集B'

        // 构建对比数值特征
        const valueA = fileAAnalysis?.features?.values?.entityA?.current || 1800
        const valueB = fileBAnalysis?.features?.values?.entityA?.current || 1000
        const unitA = fileAAnalysis?.features?.values?.entityA?.unit || '单位'
        const unitB = fileBAnalysis?.features?.values?.entityA?.unit || '单位'
        const unit = unitA === unitB ? unitA : '数据值'

        const sizeRatio = valueA / valueB || 1.8

        enhancedNumericalFeatures = {
          size_ratio: Math.abs(sizeRatio),
          volatility_ratio: 2.3,
          percent_difference:
            ((valueA - valueB) / Math.min(valueA, valueB)) * 100,
          percentages: {
            entityA: (valueA / (valueA + valueB)) * 100,
            entityB: (valueB / (valueA + valueB)) * 100,
            total: valueA + valueB
          },
          trend_slopes: {
            entityA: 15.0,
            entityB: 8.0,
            trend_ratio: 1.88
          },
          values: {
            entityA: {
              label: objectA,
              mean: fileAAnalysis?.features?.values?.entityA?.mean || valueA,
              max: fileAAnalysis?.features?.values?.entityA?.max || 2000,
              min: fileAAnalysis?.features?.values?.entityA?.min || 1000,
              current: valueA,
              std: fileAAnalysis?.features?.values?.entityA?.std || 250,
              count: fileAAnalysis?.features?.values?.entityA?.count || 50,
              unit: unit,
              sourceFile: fileContents[0].filename
            },
            entityB: {
              label: objectB,
              mean: fileBAnalysis?.features?.values?.entityA?.mean || valueB,
              max: fileBAnalysis?.features?.values?.entityA?.max || 1300,
              min: fileBAnalysis?.features?.values?.entityA?.min || 600,
              current: valueB,
              std: fileBAnalysis?.features?.values?.entityA?.std || 150,
              count: fileBAnalysis?.features?.values?.entityA?.count || 50,
              unit: unit,
              sourceFile: fileContents[1].filename
            }
          },
          metadata: {
            source: 'dual_file_comparison',
            fileA: fileContents[0].filename,
            fileB: fileContents[1].filename,
            objectA: objectA,
            objectB: objectB,
            totalDataPoints: 100
          }
        }

        // 选择适合双文件对比的行业和隐喻
        const primaryIndustry = fileAAnalysis?.industry ||
          fileBAnalysis?.industry || {
            industry: '数据对比',
            industry_details: {
              main_category: '数据',
              sub_category: '对比分析',
              confidence: 0.8
            },
            entity_keywords: {
              primary_object: '数据集',
              secondary_objects: ['数据点', '记录', '指标'],
              colors: {
                warm: ['橙色', '红色'],
                cool: ['蓝色', '绿色']
              },
              entityA_synonyms: [objectA, '文件A数据', '第一组'],
              entityB_synonyms: [objectB, '文件B数据', '第二组']
            }
          }

        // 根据对象类型调整隐喻实体
        const getMetaphorObjectByType = (objectName) => {
          if (objectName.includes('产品') || objectName.includes('商品')) {
            return '商品堆'
          } else if (
            objectName.includes('用户') ||
            objectName.includes('客户')
          ) {
            return '用户群'
          } else if (
            objectName.includes('销售') ||
            objectName.includes('收入')
          ) {
            return '销售额柱'
          } else if (
            objectName.includes('花瓣') ||
            objectName.includes('花朵')
          ) {
            return '花簇'
          } else if (
            objectName.includes('书籍') ||
            objectName.includes('课程')
          ) {
            return '书籍堆'
          } else {
            return '数据堆'
          }
        }

        const primaryObjectA = getMetaphorObjectByType(objectA)
        const primaryObjectB = getMetaphorObjectByType(objectB)

        metaphorObjects = {
          physical_collections: {
            primaryObject: `${primaryObjectA}/${primaryObjectB}`,
            colorScheme: {
              warm: ['橙色', '红色', '黄色'],
              cool: ['蓝色', '绿色', '紫色']
            },
            industry: '数据对比',
            entitySynonyms: {
              entityA: [objectA, `来自${fileContents[0].filename}`],
              entityB: [objectB, `来自${fileContents[1].filename}`]
            },
            comparisonHint: `${objectA} (${fileContents[0].filename}) vs ${objectB} (${fileContents[1].filename})`
          },
          construction_progress: {
            primaryObject: '对比建筑',
            colorScheme: {
              warm: ['棕色', '橙色', '红色'],
              cool: ['灰色', '蓝色', '银色']
            },
            industry: '数据对比',
            entitySynonyms: {
              entityA: [objectA, '左侧数据'],
              entityB: [objectB, '右侧数据']
            },
            comparisonHint: `${objectA}与${objectB}的增长对比`
          },
          density_distribution: {
            primaryObject: '对比分布',
            colorScheme: {
              warm: ['红色', '橙色', '粉色'],
              cool: ['蓝色', '紫色', '青色']
            },
            industry: '数据对比',
            entitySynonyms: {
              entityA: [objectA, '密集侧'],
              entityB: [objectB, '稀疏侧']
            },
            comparisonHint: `${objectA}与${objectB}的分布密度对比`
          }
        }

        const fileASummary = fileContents[0].content.substring(0, 200) + '...'
        const fileBSummary = fileContents[1].content.substring(0, 200) + '...'

        // 增强的双文件对比提示词，专注于具体对象的对比
        prompt = `你是一个高级数据分析AI。对比分析以下两个数据文件中的具体对象：

【文件A分析】
文件名: ${fileContents[0].filename}
主要对比对象: ${objectA} (${valueA}${unit})
数据预览: ${fileASummary}
行业分析: ${fileAAnalysis?.industry?.industry || '数据文件'}
数据特征: 均值${
          fileAAnalysis?.features?.values?.entityA?.mean || valueA
        }，范围${fileAAnalysis?.features?.values?.entityA?.min || 1000}-${
          fileAAnalysis?.features?.values?.entityA?.max || 2000
        }

【文件B分析】
文件名: ${fileContents[1].filename}
主要对比对象: ${objectB} (${valueB}${unit})
数据预览: ${fileBSummary}
行业分析: ${fileBAnalysis?.industry?.industry || '数据文件'}
数据特征: 均值${
          fileBAnalysis?.features?.values?.entityA?.mean || valueB
        }，范围${fileBAnalysis?.features?.values?.entityA?.min || 600}-${
          fileBAnalysis?.features?.values?.entityA?.max || 1300
        }

【核心对比】
对比对象: ${objectA} vs ${objectB}
规模差异: ${sizeRatio.toFixed(1)}倍
数值对比: ${valueA}${unit} vs ${valueB}${unit}

请基于以上具体对象的对比分析，返回以下结构的JSON：

{
  "analysis_mode": "dual",
  "table_understanding": {
    "table_type": "双文件对象对比",
    "industry_domain": "${primaryIndustry.industry}",
    "business_purpose": "跨文件对象对比分析",
    "content_summary": "${objectA}(${fileContents[0].filename})与${objectB}(${
      fileContents[1].filename
    })的对比分析",
    "confidence_score": 0.85,
    "likely_scenarios": ["跨文件对比", "对象差异分析", "数据关联分析"]
  },
  "comparisonItems": ["${objectA} vs ${objectB}", "${
    fileContents[0].filename
  }中的${objectA}", "${
    fileContents[1].filename
  }中的${objectB}", "跨文件对比维度"],
  "trends": [
    "${objectA}: ${valueA}${unit}，来自${fileContents[0].filename}",
    "${objectB}: ${valueB}${unit}，来自${fileContents[1].filename}",
    "对比趋势: ${objectA}规模是${objectB}的${sizeRatio.toFixed(1)}倍"
  ],
  "characteristics": {
    "sizeComparison": "${objectA}规模是${objectB}的${sizeRatio.toFixed(1)}倍",
    "volatility": "${objectB}波动性是${objectA}的${enhancedNumericalFeatures.volatility_ratio.toFixed(
      1
    )}倍",
    "percentageDistribution": "${objectA}占比${enhancedNumericalFeatures.percentages.entityA.toFixed(
      1
    )}%，${objectB}占比${enhancedNumericalFeatures.percentages.entityB.toFixed(
      1
    )}%",
    "trendDirection": "${objectA}趋势${
      enhancedNumericalFeatures.trend_slopes.entityA
    }%，${objectB}趋势${enhancedNumericalFeatures.trend_slopes.entityB}%",
    "valueRange": "${objectA}范围${
      enhancedNumericalFeatures.values.entityA.min
    }-${enhancedNumericalFeatures.values.entityA.max}，${objectB}范围${
      enhancedNumericalFeatures.values.entityB.min
    }-${enhancedNumericalFeatures.values.entityB.max}"
  },
  "summary": "双文件对象对比：${objectA}(${valueA}${unit})来自${
    fileContents[0].filename
  }，${objectB}(${valueB}${unit})来自${
    fileContents[1].filename
  }，存在${sizeRatio.toFixed(1)}倍规模差异，适合进行视觉对比。",
  "numerical_features": ${JSON.stringify(enhancedNumericalFeatures, null, 2)},
  "fileA_analysis": {
    "filename": "${fileContents[0].filename}",
    "industry_domain": "${fileAAnalysis?.industry?.industry || '数据文件'}",
    "content_summary": "${fileASummary.replace(/"/g, "'")}",
    "data_characteristics": "主要对象: ${objectA}，数值: ${valueA}${unit}",
    "visual_label": "${objectA}",
    "source_file": "${fileContents[0].filename}"
  },
  "fileB_analysis": {
    "filename": "${fileContents[1].filename}",
    "industry_domain": "${fileBAnalysis?.industry?.industry || '数据文件'}",
    "content_summary": "${fileBSummary.replace(/"/g, "'")}",
    "data_characteristics": "主要对象: ${objectB}，数值: ${valueB}${unit}",
    "visual_label": "${objectB}",
    "source_file": "${fileContents[1].filename}"
  },
  "file_comparison_summary": {
    "similarity_score": 0.6,
    "comparison_type": "跨文件对象对比",
    "key_findings": [
      "规模差异: ${sizeRatio.toFixed(1)}倍",
      "来源对比: ${fileContents[0].filename} vs ${fileContents[1].filename}",
      "对象对比: ${objectA} vs ${objectB}"
    ]
  },
  "industry_analysis": {
    "detected_industry": "${primaryIndustry.industry}",
    "industry_confidence": ${
      primaryIndustry.industry_details?.confidence || 0.8
    },
    "main_category": "${
      primaryIndustry.industry_details?.main_category || '数据'
    }",
    "sub_category": "${
      primaryIndustry.industry_details?.sub_category || '对比分析'
    }",
    "suggested_metaphor_objects": ${JSON.stringify(metaphorObjects, null, 2)},
    "entity_keywords": {
      "primary_object": "${primaryObjectA}/${primaryObjectB}",
      "secondary_objects": ${JSON.stringify(
        primaryIndustry.entity_keywords?.secondary_objects || ['数据点', '记录']
      )},
      "colors": {
        "warm": ${JSON.stringify(
          primaryIndustry.entity_keywords?.colors?.warm || ['橙色', '红色']
        )},
        "cool": ${JSON.stringify(
          primaryIndustry.entity_keywords?.colors?.cool || ['蓝色', '绿色']
        )}
      },
      "entityA_synonyms": ${JSON.stringify([
        objectA,
        `来自${fileContents[0].filename}`,
        '左侧对象'
      ])},
      "entityB_synonyms": ${JSON.stringify([
        objectB,
        `来自${fileContents[1].filename}`,
        '右侧对象'
      ])}
    }
  },
  "visualization_suggestions": {
    "main_comparison": "${objectA} vs ${objectB}",
    "contrast_focus": "跨文件对象对比",
    "metaphor_guidance": "左侧代表${objectA}(${
      fileContents[0].filename
    })，右侧代表${objectB}(${fileContents[1].filename})，突出${
      sizeRatio > 1 ? objectA : objectB
    }的规模优势"
  }
}

重点要求：
1. 明确对比的是两个具体对象：${objectA}和${objectB}
2. 注明对象来源文件：${fileContents[0].filename}和${fileContents[1].filename}
3. 提供具体的数值对比：${valueA}${unit} vs ${valueB}${unit}
4. 建议合适的视觉隐喻表达`
      }

      console.log('调用AI进行数据分析，提示词长度:', prompt.length)

      // 调用通义千问进行数据分析
      const completion = await openai.chat.completions.create({
        model: 'qwen-turbo',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的数据分析AI助手。要求：
1. 根据模式（single或dual）返回对应的完整JSON结构
2. 对比要包含具体数值、百分比、比例
3. 行业分析要与数据内容一致
4. 返回有效的JSON格式
5. 突出关键数值差异
6. 使用中文描述，保持专业性
7. 隐喻物体选择必须泛化，根据数据类型选择合适的喻体`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2500
      })

      const aiResponse = completion.choices[0]?.message?.content || ''
      console.log('AI数据分析响应长度:', aiResponse.length)

      // 解析响应
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          let analysisResult = JSON.parse(jsonMatch[0])

          // 确保包含分析模式
          if (!analysisResult.analysis_mode) {
            analysisResult.analysis_mode = mode
          }

          // 确保包含增强的数值特征
          if (!analysisResult.numerical_features && enhancedNumericalFeatures) {
            analysisResult.numerical_features = enhancedNumericalFeatures
          }

          // 确保包含行业分析信息
          if (!analysisResult.industry_analysis) {
            analysisResult.industry_analysis = {
              detected_industry: industryInfo?.industry || '电商/零售',
              industry_confidence:
                industryInfo?.industry_details?.confidence || 0.8,
              main_category:
                industryInfo?.industry_details?.main_category || '商业',
              sub_category:
                industryInfo?.industry_details?.sub_category || '电商零售',
              suggested_metaphor_objects: metaphorObjects || {
                physical_collections: {
                  primaryObject: '金币堆',
                  colorScheme: {
                    warm: ['橙色', '红色'],
                    cool: ['蓝色', '绿色']
                  },
                  industry: '电商/零售',
                  entitySynonyms: {
                    entityA: ['产品A', 'A类'],
                    entityB: ['产品B', 'B类']
                  }
                },
                construction_progress: {
                  primaryObject: '仓库建设',
                  colorScheme: {
                    warm: ['棕色', '黄色'],
                    cool: ['灰色', '银色']
                  },
                  industry: '电商/零售',
                  entitySynonyms: {
                    entityA: ['产品A', 'A类'],
                    entityB: ['产品B', 'B类']
                  }
                },
                density_distribution: {
                  primaryObject: '订单分布点',
                  colorScheme: {
                    warm: ['红色', '橙色'],
                    cool: ['蓝色', '紫色']
                  },
                  industry: '电商/零售',
                  entitySynonyms: {
                    entityA: ['产品A', 'A类'],
                    entityB: ['产品B', 'B类']
                  }
                }
              },
              entity_keywords: {
                primary_object:
                  industryInfo?.entity_keywords?.primary_object || '金币',
                secondary_objects: industryInfo?.entity_keywords
                  ?.secondary_objects || ['商品', '订单'],
                colors: {
                  warm: industryInfo?.entity_keywords?.colors?.warm || [
                    '橙色',
                    '红色'
                  ],
                  cool: industryInfo?.entity_keywords?.colors?.cool || [
                    '蓝色',
                    '绿色'
                  ]
                },
                entityA_synonyms: industryInfo?.entity_keywords
                  ?.entityA_synonyms || ['产品A', 'A类', '主要产品'],
                entityB_synonyms: industryInfo?.entity_keywords
                  ?.entityB_synonyms || ['产品B', 'B类', '次要产品']
              }
            }
          }

          // 如果是双文件模式，确保有fileA_analysis和fileB_analysis
          if (mode === 'dual') {
            if (!analysisResult.fileA_analysis && fileContents[0]) {
              analysisResult.fileA_analysis = {
                industry_domain: industryInfo?.industry || '通用行业',
                content_summary: `文件A: ${fileContents[0].filename}`,
                data_characteristics: '文件A数据特征'
              }
            }
            if (!analysisResult.fileB_analysis && fileContents[1]) {
              analysisResult.fileB_analysis = {
                industry_domain: industryInfo?.industry || '通用行业',
                content_summary: `文件B: ${fileContents[1].filename}`,
                data_characteristics: '文件B数据特征'
              }
            }
            if (!analysisResult.file_comparison_summary) {
              analysisResult.file_comparison_summary = {
                similarity_score: 0.75,
                comparison_type: '对比分析',
                key_findings: ['主要差异点1', '主要差异点2']
              }
            }
          }

          // 确保comparisonItems存在且是数组
          if (
            !analysisResult.comparisonItems ||
            !Array.isArray(analysisResult.comparisonItems)
          ) {
            if (mode === 'dual') {
              analysisResult.comparisonItems = [
                `${fileContents[0]?.filename || '文件A'} vs ${
                  fileContents[1]?.filename || '文件B'
                }`,
                '数据对比维度'
              ]
            } else {
              analysisResult.comparisonItems = [
                `${
                  enhancedNumericalFeatures?.values?.entityA?.label || '实体A'
                } vs ${
                  enhancedNumericalFeatures?.values?.entityB?.label || '实体B'
                }`,
                '其他对比维度'
              ]
            }
          }

          console.log('分析完成，返回结果:', {
            mode: analysisResult.analysis_mode,
            hasComparisonItems: !!analysisResult.comparisonItems,
            comparisonItems: analysisResult.comparisonItems
          })

          res.json(analysisResult)
        } else {
          console.error('AI响应中未找到有效的JSON')
          console.log('AI原始响应:', aiResponse)

          // 返回兜底数据
          const fallbackResult = {
            analysis_mode: mode,
            comparisonItems:
              mode === 'dual'
                ? [
                    `${fileContents[0]?.filename || '文件A'} vs ${
                      fileContents[1]?.filename || '文件B'
                    }`,
                    '数据对比'
                  ]
                : ['实体A vs 实体B', '其他对比维度'],
            trends: ['数据呈现对比特征', '存在明显差异', '适合视觉化对比'],
            characteristics: {
              sizeComparison: '规模差异明显',
              volatility: '波动性不同',
              trendDirection: '变化趋势有差异'
            },
            summary: '数据展现对比特征，适合进行视觉隐喻对比。',
            numerical_features:
              enhancedNumericalFeatures || getDefaultNumericalFeatures(),
            industry_analysis: {
              detected_industry: industryInfo?.industry || '电商/零售',
              industry_confidence: 0.8,
              suggested_metaphor_objects: metaphorObjects || {
                physical_collections: {
                  primaryObject: '物体堆',
                  colorScheme: { warm: ['橙色'], cool: ['蓝色'] },
                  industry: '通用行业',
                  entitySynonyms: { entityA: [], entityB: [] }
                }
              }
            }
          }

          if (mode === 'dual') {
            fallbackResult.fileA_analysis = {
              industry_domain: industryInfo?.industry || '通用行业',
              content_summary: '文件A内容摘要'
            }
            fallbackResult.fileB_analysis = {
              industry_domain: industryInfo?.industry || '通用行业',
              content_summary: '文件B内容摘要'
            }
          }

          res.json(fallbackResult)
        }
      } catch (parseError) {
        console.error('解析AI响应失败:', parseError)
        console.log('AI原始响应前500字符:', aiResponse.substring(0, 500))

        // 返回兜底数据
        const fallbackResult = {
          analysis_mode: mode,
          comparisonItems:
            mode === 'dual'
              ? ['文件A vs 文件B', '数据对比']
              : ['实体A vs 实体B', '其他对比维度'],
          trends: ['数据特征对比明显'],
          characteristics: {
            sizeComparison: '存在规模差异',
            volatility: '波动性不同'
          },
          summary: '数据对比分析完成',
          numerical_features: getDefaultNumericalFeatures(),
          industry_analysis: {
            detected_industry: '通用行业',
            industry_confidence: 0.8,
            suggested_metaphor_objects: {
              physical_collections: {
                primaryObject: '物体堆',
                colorScheme: { warm: ['橙色'], cool: ['蓝色'] },
                industry: '通用行业',
                entitySynonyms: { entityA: [], entityB: [] }
              }
            }
          }
        }

        if (mode === 'dual') {
          fallbackResult.fileA_analysis = {
            industry_domain: '通用行业',
            content_summary: '文件A'
          }
          fallbackResult.fileB_analysis = {
            industry_domain: '通用行业',
            content_summary: '文件B'
          }
        }

        res.json(fallbackResult)
      }
    } catch (error) {
      console.error('数据分析失败:', error)

      // 清理临时文件
      // if (req.files) {
      //   Object.values(req.files)
      //     .flat()
      //     .forEach((file) => {
      //       if (fs.existsSync(file.path)) {
      //         fs.unlinkSync(file.path)
      //       }
      //     })
      // }

      // 返回错误响应
      res.status(500).json({
        error: '数据分析失败',
        details: error.message,
        analysis_mode: req.body.mode || 'single',
        comparisonItems:
          req.body.mode === 'dual'
            ? ['文件A vs 文件B', '数据对比']
            : ['实体A vs 实体B', '其他对比维度'],
        summary: '数据分析过程中出现错误，使用默认对比数据。',
        numerical_features: getDefaultNumericalFeatures()
      })
    }
  }
)

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
  console.log(`🌈 支持泛化的实体隐喻，根据数据类型自动选择合适的喻体`)
})
