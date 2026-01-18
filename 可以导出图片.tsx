import { useState, useEffect } from 'react'

// 概念隐喻类型
const metaphorTypes = [
  {
    id: 1,
    name: '实体隐喻',
    description: '将对比数据拟人化为角色或实体在场景中互动',
    icon: '👤',
    example: '数据特征A→沉稳实体，数据特征B→活跃实体，在同一场景互动',
    color: 'from-blue-400 to-cyan-400',
    bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50'
  },
  {
    id: 2,
    name: '结构隐喻',
    description: '将数据趋势差异映射为故事结构或建筑形态',
    icon: '🏗️',
    example: '稳定趋势→坚固结构，变化趋势→动态结构，形成对比',
    color: 'from-emerald-400 to-green-400',
    bgColor: 'bg-gradient-to-br from-emerald-50 to-green-50'
  },
  {
    id: 3,
    name: '方位隐喻',
    description: '通过空间位置和色彩布局展现数据对比关系',
    icon: '🧭',
    example: '左侧区域代表特征A，右侧区域代表特征B，空间对比',
    color: 'from-violet-400 to-purple-400',
    bgColor: 'bg-gradient-to-br from-violet-50 to-purple-50'
  },
  {
    id: 4,
    name: '图像隐喻',
    description: '用图像形态和纹理对比展现数据特征差异',
    icon: '🎨',
    example: '平缓形态对比起伏形态，不同纹理展现数据特性',
    color: 'from-pink-400 to-rose-400',
    bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50'
  }
]

// 上传模式
type UploadMode = 'single' | 'dual'

// 类型定义
interface GeneratedImage {
  url: string
  description: string
  prompt: string
}

// API响应类型定义
interface TextGenerationResponse {
  content: string
}

interface ImageGenerationResponse {
  output?: {
    choices?: Array<{
      message?: {
        content?: Array<{
          image?:
            | {
                url?: string
              }
            | string
        }>
      }
    }>
    image?: string
    task_result?: {
      url?: string
    }
  }
}

// 数据分析结果接口 - 更新为完整的接口定义
interface DataAnalysisResult {
  table_understanding?: {
    table_type: string
    industry_domain: string
    business_purpose: string
    content_summary: string
    confidence_score: number
    likely_scenarios: string[]
  }
  table_understanding_explained?: string
  comparisonItems: string[]
  trends: string[]
  characteristics: DataCharacteristics
  summary: string
}

// 数据特征接口定义
interface DataCharacteristics {
  sizeComparison?: string
  volatility?: string
  trendDirection?: string
  correlation?: string
  distributionType?: string
  // 添加其他可能的数据特征属性
  [key: string]: string | number | boolean | undefined
}

function App() {
  const [typedText, setTypedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [uploadMode, setUploadMode] = useState<UploadMode>('single')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFileA, setUploadedFileA] = useState<File | null>(null)
  const [uploadedFileB, setUploadedFileB] = useState<File | null>(null)
  const [selectedMetaphor, setSelectedMetaphor] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAnalyzingData, setIsAnalyzingData] = useState(false)
  const [narrativeResult, setNarrativeResult] = useState('')
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(
    null
  )
  const [showDemo, setShowDemo] = useState(false)
  const [activeStep, setActiveStep] = useState(1)
  const [dataAnalysis, setDataAnalysis] = useState<DataAnalysisResult | null>(
    null
  )

  // 打字机效果
  useEffect(() => {
    const fullText = '概念隐喻驱动的数据对比叙事生成系统'
    let currentIndex = 0

    if (isTyping) {
      const typingInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setTypedText(fullText.slice(0, currentIndex))
          currentIndex++
        } else {
          setIsTyping(false)
          clearInterval(typingInterval)
        }
      }, 80)

      return () => clearInterval(typingInterval)
    }
  }, [isTyping])

  // 监听文件变化，重置相关状态
  useEffect(() => {
    // 当文件变化时，重置分析结果和生成结果
    if (uploadMode === 'single' && uploadedFile) {
      setDataAnalysis(null)
      setNarrativeResult('')
      setGeneratedImage(null)
      setActiveStep(2) // 进入第二步：数据分析
    } else if (uploadMode === 'dual' && uploadedFileA && uploadedFileB) {
      setDataAnalysis(null)
      setNarrativeResult('')
      setGeneratedImage(null)
      setActiveStep(2) // 进入第二步：数据分析
    } else {
      setActiveStep(1) // 回到第一步：数据输入
    }
  }, [uploadMode, uploadedFile, uploadedFileA, uploadedFileB])

  // 处理文件上传 - 单文件模式
  const handleSingleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (
        !file.name.endsWith('.csv') &&
        !file.name.endsWith('.xlsx') &&
        !file.name.endsWith('.xls') &&
        !file.name.endsWith('.json')
      ) {
        alert('请上传 CSV、Excel 或 JSON 文件')
        return
      }
      setUploadedFile(file)
    }
  }

  // 处理文件上传 - 双文件模式
  const handleDualFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'groupA' | 'groupB'
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      if (
        !file.name.endsWith('.csv') &&
        !file.name.endsWith('.xlsx') &&
        !file.name.endsWith('.xls') &&
        !file.name.endsWith('.json')
      ) {
        alert('请上传 CSV、Excel 或 JSON 文件')
        return
      }

      if (type === 'groupA') {
        setUploadedFileA(file)
      } else {
        setUploadedFileB(file)
      }
    }
  }

  // 移除文件
  const removeFile = (type: 'single' | 'groupA' | 'groupB') => {
    if (type === 'single') {
      setUploadedFile(null)
      setDataAnalysis(null)
      setNarrativeResult('')
      setGeneratedImage(null)
    } else if (type === 'groupA') {
      setUploadedFileA(null)
      setDataAnalysis(null)
      setNarrativeResult('')
      setGeneratedImage(null)
    } else {
      setUploadedFileB(null)
      setDataAnalysis(null)
      setNarrativeResult('')
      setGeneratedImage(null)
    }
  }

  // 分析数据（调用API后端）
  const analyzeData = async (): Promise<DataAnalysisResult> => {
    setIsAnalyzingData(true)

    try {
      console.log('开始数据分析...')

      const formData = new FormData()

      if (uploadMode === 'single' && uploadedFile) {
        formData.append('file', uploadedFile)
        formData.append('mode', 'single')
      } else if (uploadMode === 'dual' && uploadedFileA && uploadedFileB) {
        formData.append('fileA', uploadedFileA)
        formData.append('fileB', uploadedFileB)
        formData.append('mode', 'dual')
      } else {
        throw new Error('请先上传文件')
      }

      const response = await fetch('http://localhost:3001/api/analyze-data', {
        method: 'POST',
        body: formData
      })

      console.log('数据分析响应状态:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('数据分析错误:', errorText)
        throw new Error(`数据分析失败: ${response.status}`)
      }

      const result = await response.json()
      console.log('数据分析结果:', result)

      // 更新状态并进入下一步
      setDataAnalysis(result)
      setActiveStep(3)

      return result
    } catch (error) {
      console.error('数据分析失败:', error)

      // 提供演示用的分析结果
      const demoAnalysis: DataAnalysisResult = {
        comparisonItems: ['产品A vs 产品B', '线上 vs 线下', '季度趋势对比'],
        trends: [
          '产品A稳步上升，季度增长约15%',
          '产品B波动较大，峰值在Q3',
          '线上渠道增长快于线下'
        ],
        characteristics: {
          sizeComparison: '产品A规模约为产品B的1.8倍',
          volatility: '产品B波动性是产品A的2.3倍',
          trendDirection: '两者均呈上升趋势，但节奏不同'
        },
        summary:
          '数据展现明显的对比特征：规模差异、波动性差异、增长节奏差异，适合进行视觉隐喻对比。'
      }

      setDataAnalysis(demoAnalysis)
      setActiveStep(3)

      return demoAnalysis
    } finally {
      setIsAnalyzingData(false)
    }
  }

  // 备用图片
  const getFallbackImage = (): string => {
    return 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=1024&h=768&fit=crop&auto=format'
  }

  // 生成对比提示词
  const generateContrastPromptByAI = async (
    analysis: DataAnalysisResult,
    metaphorType: (typeof metaphorTypes)[0]
  ): Promise<string> => {
    const prompt = `你是专业视觉隐喻设计师，基于概念隐喻理论生成数据对比图像提示词。

数据分析结果：
${analysis.summary}

关键对比项：
${analysis.comparisonItems.map((item) => `- ${item}`).join('\n')}

趋势特征：
${analysis.trends.map((trend) => `- ${trend}`).join('\n')}

数据特征：
${Object.entries(analysis.characteristics)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

隐喻类型：${metaphorType.name}
原理：${metaphorType.description}
示例：${metaphorType.example}

要求：
1. 必须生成单一张图像，体现数据对比关系
2. 严格使用${metaphorType.name}原理
3. 通过左右分割或场景融合展现对比
4. 左侧用暖色调（偏黄/橙），右侧用冷色调（偏蓝/青）
5. 根据数据特征设计视觉元素：稳定vs变化、有序vs动态、平缓vs起伏
6. 规模差异通过元素大小/数量/密度体现
7. 使用积极、健康的隐喻：如自然场景、建筑结构、艺术装置等
8. 避免任何敏感或争议性内容
9. 输出单一文生图提示词（80-120字），直接用于图像生成

安全要求：确保提示词内容符合AI伦理和安全规范。`

    try {
      const response = await fetch('http://localhost:3001/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`)

      const result = (await response.json()) as TextGenerationResponse
      const content = result.content.trim()

      // 安全检查
      const sensitiveWords = [
        'war',
        'battle',
        'fight',
        'attack',
        'military',
        'weapon',
        'death',
        'kill',
        '冲突',
        '战争',
        '战斗',
        '攻击',
        '军事',
        '武器',
        '死亡',
        '血腥',
        '暴力'
      ]
      const lowerContent = content.toLowerCase()

      for (const word of sensitiveWords) {
        if (lowerContent.includes(word.toLowerCase())) {
          console.warn('生成的提示词包含敏感词汇，使用备用提示词')
          return getFallbackContrastPrompt(analysis, metaphorType)
        }
      }

      return content || getFallbackContrastPrompt(analysis, metaphorType)
    } catch (error) {
      console.error('AI生成对比提示词失败，使用备用提示词', error)
      return getFallbackContrastPrompt(analysis, metaphorType)
    }
  }

  // 备用对比提示词
  const getFallbackContrastPrompt = (
    analysis: DataAnalysisResult,
    metaphorType: (typeof metaphorTypes)[0]
  ): string => {
    const keyComparison = analysis.comparisonItems[0] || '特征A vs 特征B'
    const mainTrend = analysis.trends[0] || '数据呈现对比特征'

    let prompt = ''
    switch (metaphorType.id) {
      case 1: // 实体隐喻
        prompt = `在同一场景中，左侧代表${
          keyComparison.split(' vs ')[0] || '特征A'
        }的实体沉稳安定，右侧代表${
          keyComparison.split(' vs ')[1] || '特征B'
        }的实体活跃多变。通过实体姿态和互动展现${mainTrend}。暖色调与冷色调对比，简约现代艺术风格。`
        break
      case 2: // 结构隐喻
        prompt = `对比结构场景：左侧元素代表${
          keyComparison.split(' vs ')[0] || '特征A'
        }，呈现稳定有序的几何排列；右侧元素代表${
          keyComparison.split(' vs ')[1] || '特征B'
        }，呈现动态变化的有机形态。展现${mainTrend}。现代建筑艺术风格，光影对比。`
        break
      case 3: // 方位隐喻
        prompt = `空间布局对比：画面左侧温暖区域代表${
          keyComparison.split(' vs ')[0] || '特征A'
        }，形态稳定延伸；画面右侧冷色调区域代表${
          keyComparison.split(' vs ')[1] || '特征B'
        }，形态变化起伏。${mainTrend}。抽象空间艺术，层次分明。`
        break
      case 4: // 图像隐喻
        prompt = `图像形态对比：左半部温暖色调的平缓纹理代表${
          keyComparison.split(' vs ')[0] || '特征A'
        }，右半部冷色调的起伏纹理代表${
          keyComparison.split(' vs ')[1] || '特征B'
        }。${mainTrend}。数字艺术风格，柔和过渡。`
        break
      default:
        prompt = `数据对比视觉场景：左侧温暖元素代表${
          keyComparison.split(' vs ')[0] || '特征A'
        }，右侧冷色元素代表${
          keyComparison.split(' vs ')[1] || '特征B'
        }。展现数据对比关系。抽象表现主义。`
    }
    return prompt
  }

  // 文本生成 - 新增格式化函数
  const generateTextWithQWEN = async (prompt: string): Promise<string> => {
    try {
      console.log('调用后端文本生成API...')

      const response = await fetch('http://localhost:3001/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt
        })
      })

      console.log('后端文本生成响应状态:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('后端文本生成错误:', errorText)
        throw new Error(`文本生成请求失败: ${response.status}`)
      }

      const result = (await response.json()) as TextGenerationResponse
      console.log('文本生成API响应:', result)

      // 新增：格式化返回的文本，去除Markdown符号
      const rawContent = result.content || '未收到有效响应'
      return formatTextContent(rawContent)
    } catch (error) {
      console.error('文本生成失败:', error)
      throw error
    }
  }

  // 新增：格式化文本内容，去除Markdown符号
  const formatTextContent = (text: string): string => {
    if (!text) return ''

    // 去除常见的Markdown符号
    let formatted = text
      .replace(/^#+\s*/gm, '') // 去除标题
      .replace(/\*\*(.*?)\*\*/g, '$1') // 去除加粗
      .replace(/\*(.*?)\*/g, '$1') // 去除斜体
      .replace(/`(.*?)`/g, '$1') // 去除代码标记
      .replace(/---+/g, '') // 去除分隔线
      .replace(/\n{3,}/g, '\n\n') // 减少多余空行

    // 格式化列表
    formatted = formatted.replace(/^\s*[-*]\s*/gm, '• ') // 统一列表符号

    // 确保文本开头没有多余空格
    formatted = formatted.trim()

    return formatted
  }

  // 图像生成
  const generateImageWithQWEN = async (prompt: string): Promise<string> => {
    try {
      console.log('调用通义千问文生图API生成对比图像...')
      console.log('对比提示词:', prompt.substring(0, 150) + '...')

      const response = await fetch('http://localhost:3001/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt
        })
      })

      console.log('代理服务器响应状态:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('代理服务器错误:', errorText)
        throw new Error(`图像生成请求失败: ${response.status}`)
      }

      const result = (await response.json()) as ImageGenerationResponse
      console.log('代理返回的完整响应:', result)

      let imageUrl: string | null = null

      // 解析响应中的图像URL
      if (result.output?.choices?.[0]?.message?.content) {
        const content = result.output.choices[0].message.content
        if (Array.isArray(content)) {
          for (const item of content) {
            if (
              typeof item.image === 'object' &&
              item.image &&
              'url' in item.image
            ) {
              imageUrl = (item.image as { url: string }).url
              break
            } else if (typeof item.image === 'string') {
              imageUrl = item.image
              break
            }
          }
        }
      }

      if (
        !imageUrl &&
        result.output?.image &&
        typeof result.output.image === 'string'
      ) {
        imageUrl = result.output.image
      }

      if (
        !imageUrl &&
        result.output?.task_result?.url &&
        typeof result.output.task_result.url === 'string'
      ) {
        imageUrl = result.output.task_result.url
      }

      if (imageUrl) {
        console.log('成功获取对比图像URL:', imageUrl)
        return imageUrl
      } else {
        console.error('无法从响应中解析图像URL，使用备用图片')
        return getFallbackImage()
      }
    } catch (error) {
      console.error('对比图像生成失败:', error)
      return getFallbackImage()
    }
  }

  // 在App组件中添加表格理解展示 - 位置调整到更合适的地方
  const renderTableUnderstanding = (analysis: DataAnalysisResult) => {
    if (!analysis.table_understanding) return null

    const understanding = analysis.table_understanding

    return (
      <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-lg">
        <h3 className="mb-4 flex items-center text-xl font-bold text-blue-900">
          <span className="mr-2">🔍</span> 表格智能理解
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">表格类型：</span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                {understanding.table_type.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">行业领域：</span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                {understanding.industry_domain.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">业务用途：</span>
              <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
                {understanding.business_purpose.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">分析置信度：</span>
              <div className="flex items-center">
                <div className="mr-2 h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                    style={{
                      width: `${understanding.confidence_score * 100}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {(understanding.confidence_score * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-gray-800">内容摘要：</h4>
            <p className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-600">
              {understanding.content_summary}
            </p>
          </div>
        </div>

        {/* 使用场景 */}
        {understanding.likely_scenarios &&
          understanding.likely_scenarios.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 font-semibold text-gray-800">
                可能的使用场景：
              </h4>
              <div className="flex flex-wrap gap-2">
                {understanding.likely_scenarios.map((scenario, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1 text-xs font-medium text-amber-700"
                  >
                    {scenario}
                  </span>
                ))}
              </div>
            </div>
          )}

        {/* AI解释按钮 */}
        {analysis.table_understanding_explained && (
          <div className="mt-6">
            <button
              onClick={() => {
                alert(
                  `AI深度解释：\n\n${analysis.table_understanding_explained}`
                )
              }}
              className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105"
            >
              🤖 查看AI深度解释
            </button>
          </div>
        )}
      </div>
    )
  }

  // 主生成函数 - 更新文本生成逻辑
  const handleGenerateNarrative = async () => {
    if (uploadMode === 'single' && !uploadedFile && !showDemo) {
      alert('请先上传数据文件')
      return
    }

    if (
      uploadMode === 'dual' &&
      (!uploadedFileA || !uploadedFileB) &&
      !showDemo
    ) {
      alert('请先上传两个对比数据文件')
      return
    }

    setIsGenerating(true)
    setActiveStep(4)
    setNarrativeResult('')

    try {
      // 1. 分析数据（如果还没有分析结果）
      let analysis = dataAnalysis
      if (!analysis) {
        analysis = await analyzeData()
      }

      // 2. 获取隐喻类型信息
      const metaphorType = metaphorTypes.find((m) => m.id === selectedMetaphor)!
      const metaphorTypeName = metaphorType.name
      const metaphorDescription = metaphorType.description

      // 3. 构建文本分析提示词 - 改进为更严格的格式要求
      const textPrompt = `你是一位数据科学家，基于以下数据分析结果生成对比叙事：

数据分析摘要：
${analysis.summary}

关键对比：
${analysis.comparisonItems.map((item) => `- ${item}`).join('\n')}

趋势特征：
${analysis.trends.map((trend) => `- ${trend}`).join('\n')}

使用${metaphorTypeName}(${metaphorDescription})进行对比分析。

【重要要求】
1. 请直接回答，不要使用任何Markdown格式符号（如#、**、*、---等）
2. 请使用清晰的自然语言段落，不要使用标题符号
3. 请用中文回答，语言要亲切易懂
4. 结构包含以下部分（但不使用标题）：
   - 数据对比概览：简要介绍分析的核心发现
   - 核心差异分析：详细分析主要差异点
   - 隐喻映射解释：说明如何将数据对比映射到视觉隐喻
   - 视觉叙事建议：提供生成对比图像的具体建议
5. 语言要简洁明了，避免专业术语，用通俗易懂的方式表达

现在请开始你的分析：`

      // 4. 并发生成文本和对比提示词
      const [aiResponse, contrastPrompt] = await Promise.all([
        generateTextWithQWEN(textPrompt),
        generateContrastPromptByAI(analysis as DataAnalysisResult, metaphorType)
      ])

      // 5. 生成单张对比图像
      console.log('开始生成对比图像...')
      const contrastImageUrl = await generateImageWithQWEN(contrastPrompt)

      setGeneratedImage({
        url: contrastImageUrl,
        description: `数据对比叙事 - ${metaphorTypeName}`,
        prompt: contrastPrompt
      })

      console.log('对比图像生成成功')

      // 6. 优化文本展示样式 - 完全重构，使用组件化的方式
      const formattedResponse = `
<div class="space-y-6 text-gray-700">
  <!-- 标题区域 -->
  <div class="text-2xl font-bold text-gray-900 flex items-center">
    <span class="mr-2">📊</span> 数据对比分析报告（${metaphorTypeName}）
  </div>

  <!-- 对比框架说明 -->
  <div class="bg-gradient-to-r from-amber-50 via-purple-50 to-sky-50 rounded-xl p-4 border border-gray-200">
    <div class="font-semibold text-purple-800 mb-1">对比分析框架</div>
    <div class="text-sm text-gray-600 mb-2">通过${metaphorTypeName}在同一场景中展现数据对比</div>
    <div class="text-sm text-gray-700 italic">${metaphorType.example}</div>
  </div>

  <!-- 表格理解展示（如果存在） -->
  ${
    analysis.table_understanding
      ? `
  <div class="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
    <div class="font-semibold text-blue-800 mb-2">📋 表格智能识别</div>
    <div class="text-sm text-gray-700">
      系统识别该表格为<strong>${analysis.table_understanding.table_type}</strong>类型，
      属于<strong>${analysis.table_understanding.industry_domain}</strong>领域，
      主要用于<strong>${analysis.table_understanding.business_purpose}</strong>。
    </div>
  </div>
  `
      : ''
  }

  <!-- AI生成的内容区域 -->
  <div class="space-y-4">
    ${aiResponse
      .split('\n\n')
      .map((section) => {
        if (!section.trim()) return ''

        // 根据内容判断段落类型
        if (section.includes('概览') || section.includes('概览')) {
          return `
        <div class="bg-gradient-to-br from-white to-amber-50/20 rounded-lg p-4 border border-amber-200">
          <div class="flex items-center mb-2">
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 flex items-center justify-center mr-3">
              <span class="text-white text-sm">📈</span>
            </div>
            <div class="font-bold text-gray-800">数据对比概览</div>
          </div>
          <div class="text-gray-700">${section}</div>
        </div>
        `
        } else if (
          section.includes('差异') ||
          section.includes('对比') ||
          section.includes('不同')
        ) {
          return `
        <div class="bg-gradient-to-br from-white to-sky-50/20 rounded-lg p-4 border border-sky-200">
          <div class="flex items-center mb-2">
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 flex items-center justify-center mr-3">
              <span class="text-white text-sm">⚖️</span>
            </div>
            <div class="font-bold text-gray-800">核心差异分析</div>
          </div>
          <div class="text-gray-700">${section}</div>
        </div>
        `
        } else if (
          section.includes('隐喻') ||
          section.includes('映射') ||
          section.includes('视觉')
        ) {
          return `
        <div class="bg-gradient-to-br from-white to-purple-50/20 rounded-lg p-4 border border-purple-200">
          <div class="flex items-center mb-2">
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center mr-3">
              <span class="text-white text-sm">🎨</span>
            </div>
            <div class="font-bold text-gray-800">隐喻映射解释</div>
          </div>
          <div class="text-gray-700">${section}</div>
        </div>
        `
        } else if (
          section.includes('建议') ||
          section.includes('叙事') ||
          section.includes('图像')
        ) {
          return `
        <div class="bg-gradient-to-br from-white to-emerald-50/20 rounded-lg p-4 border border-emerald-200">
          <div class="flex items-center mb-2">
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-green-400 flex items-center justify-center mr-3">
              <span class="text-white text-sm">💡</span>
            </div>
            <div class="font-bold text-gray-800">视觉叙事建议</div>
          </div>
          <div class="text-gray-700">${section}</div>
        </div>
        `
        } else {
          // 默认段落
          return `
        <div class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div class="text-gray-700">${section}</div>
        </div>
        `
        }
      })
      .join('')}
  </div>

  <!-- 图像说明区域 -->
  <div class="mt-8 pt-6 border-t border-gray-200">
    <div class="text-xl font-bold text-gray-800 flex items-center">
      <span class="mr-2">🖼️</span> 生成的数据对比图像
    </div>
    <div class="text-gray-600 mt-2">基于${metaphorTypeName}原理生成的数据对比视觉叙事</div>
  </div>
</div>
      `

      setNarrativeResult(formattedResponse)
    } catch (error: unknown) {
      console.error('生成失败:', error)

      // 出错时的备用响应
      const metaphorType = metaphorTypes.find((m) => m.id === selectedMetaphor)!
      const analysis = dataAnalysis || {
        table_understanding: undefined,
        table_understanding_explained: undefined,
        comparisonItems: ['特征A vs 特征B'],
        trends: ['数据呈现对比特征'],
        characteristics: {}, // 确保包含这个属性
        summary: '数据展现对比关系，适合进行视觉隐喻表达。'
      }

      const fallbackResponse = `
<div class="space-y-6 text-gray-700">
  <div class="text-2xl font-bold text-gray-900 flex items-center">
    <span class="mr-2">📊</span> 数据对比分析报告（演示模式）
  </div>

  <div class="bg-gradient-to-r from-amber-50 via-purple-50 to-sky-50 rounded-xl p-4 border border-gray-200">
    <div class="font-semibold text-purple-800">${
      metaphorType.name
    }对比框架</div>
    <div class="text-sm text-gray-600 mt-1">${metaphorType.description}</div>
  </div>

  ${
    analysis.table_understanding
      ? `
  <div class="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
    <div class="font-semibold text-blue-800 mb-2">📋 表格智能识别</div>
    <div class="text-sm text-gray-700">
      系统识别该表格为<strong>${analysis.table_understanding.table_type}</strong>类型，
      属于<strong>${analysis.table_understanding.industry_domain}</strong>领域。
    </div>
  </div>
  `
      : ''
  }

  <div class="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
    <div class="text-lg font-bold text-gray-800 mb-3">数据对比概览</div>
    <div class="text-gray-700">${analysis.summary}</div>
    <div class="mt-3 space-y-2">
      <div class="font-semibold text-gray-800">关键对比项：</div>
      ${analysis.comparisonItems
        .map(
          (item) => `<div class="text-sm text-gray-600 pl-4">• ${item}</div>`
        )
        .join('')}
    </div>
  </div>

  <div class="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
    <div class="text-lg font-bold text-gray-800 mb-2">${
      metaphorType.name
    }解释</div>
    <div class="text-gray-700">${metaphorType.example}</div>
    <div class="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
      <div class="font-semibold text-gray-800">视觉映射：</div>
      <div class="mt-1 flex items-center">
        <span class="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 mr-2"></span>
        左侧暖色 → ${analysis.comparisonItems[0]?.split(' vs ')[0] || '特征A'}
      </div>
      <div class="mt-1 flex items-center">
        <span class="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 mr-2"></span>
        右侧冷色 → ${analysis.comparisonItems[0]?.split(' vs ')[1] || '特征B'}
      </div>
    </div>
  </div>

  <div class="mt-8 pt-6 border-t border-gray-200">
    <div class="text-xl font-bold text-gray-800 flex items-center">
      <span class="mr-2">🖼️</span> 对比视觉叙事
    </div>
    <div class="text-gray-600 mt-2">单张图像中的两组数据对比：左侧数据特征A，右侧数据特征B</div>
    <div class="grid grid-cols-1 gap-4 mt-4">
      <div class="bg-gradient-to-r from-amber-50 to-sky-50 rounded-lg p-4 border border-gray-200">
        <div class="font-bold text-gray-800 mb-2">对比图像描述</div>
        <div class="text-sm text-gray-700">
          ${
            metaphorType.id === 1
              ? '同一场景中两个实体互动：左侧实体沉稳安定，右侧实体活跃多变'
              : metaphorType.id === 2
                ? '结构对比：左侧稳定有序结构，右侧动态有机形态'
                : metaphorType.id === 3
                  ? '空间布局：左侧暖色稳定区域，右侧冷色变化区域'
                  : '图像形态：左侧暖色平缓纹理，右侧冷色起伏纹理'
          }
        </div>
      </div>
    </div>
    <div class="mt-4 text-sm text-gray-500">*网络连接有问题，显示本地分析结果*</div>
  </div>
</div>
      `

      setNarrativeResult(fallbackResponse)

      // 使用备用对比图像
      setGeneratedImage({
        url: getFallbackImage(),
        description: `数据对比 - ${metaphorType.name}（备用）`,
        prompt: getFallbackContrastPrompt(analysis, metaphorType)
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // 查看演示数据
  const handleViewDemo = () => {
    setShowDemo(true)
    if (uploadMode === 'single') {
      setUploadedFile(new File([], '示例数据.csv'))
    } else {
      setUploadedFileA(new File([], '数据A.csv'))
      setUploadedFileB(new File([], '数据B.csv'))
    }
  }

  // 在App.tsx中添加图片导出函数
  const handleExportImage = async (imageUrl: string, description: string) => {
    try {
      setIsGenerating(true)

      // 清理描述文本用于文件名
      const cleanDescription = description
        .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '_')
        .substring(0, 50)

      const filename = `数据对比_${cleanDescription}_${
        new Date().toISOString().split('T')[0]
      }.png`

      // 尝试使用HTML5 download属性
      const a = document.createElement('a')
      a.href = imageUrl
      a.download = filename

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // 如果5秒后还在加载状态，自动重置
      setTimeout(() => {
        setIsGenerating(false)
      }, 5000)
    } catch (error) {
      console.error('导出失败:', error)

      setIsGenerating(false)
    }
  }

  // 简单图表组件
  const DataChart = () => (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-blue-50/30 p-6 shadow-lg backdrop-blur-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800">数据对比演示</h3>
          <p className="mt-1 text-sm text-gray-500">
            系统将自动分析数据中的对比特征
          </p>
        </div>
        <div className="rounded-full bg-gradient-to-r from-amber-500 to-sky-500 px-3 py-1">
          <span className="text-xs font-semibold text-white">演示模式</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <div className="mr-2 size-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"></div>
            <span>数据特征A</span>
          </div>
          <div className="flex items-center">
            <div className="mr-2 size-3 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400"></div>
            <span>数据特征B</span>
          </div>
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  时段 {item}
                </span>
                <div className="flex space-x-6">
                  <span className="text-sm font-semibold text-amber-600">
                    {(1200 + Math.random() * 600).toFixed(0)}
                  </span>
                  <span className="text-sm font-semibold text-sky-600">
                    {(1800 + Math.random() * 800).toFixed(0)}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <div className="flex-1 overflow-hidden rounded-full bg-gradient-to-r from-amber-100 to-amber-50">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-700"
                    style={{ width: `${60 + Math.random() * 20}%` }}
                  ></div>
                </div>
                <div className="flex-1 overflow-hidden rounded-full bg-gradient-to-r from-sky-100 to-sky-50">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-all delay-100 duration-700"
                    style={{ width: `${70 + Math.random() * 25}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-600">
            <div className="mb-2 font-semibold">系统将分析：</div>
            <div className="space-y-1">
              <div className="flex items-center">
                <div className="mr-2 size-2 rounded-full bg-green-500"></div>
                <span>趋势对比与差异识别</span>
              </div>
              <div className="flex items-center">
                <div className="mr-2 size-2 rounded-full bg-blue-500"></div>
                <span>关键特征提取与对比</span>
              </div>
              <div className="flex items-center">
                <div className="mr-2 size-2 rounded-full bg-purple-500"></div>
                <span>适合的视觉隐喻选择</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // 检查是否可以进入下一步
  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 1: // 数据输入
        return true // 始终可以
      case 2: // 数据分析
        if (uploadMode === 'single' && uploadedFile) return true
        if (uploadMode === 'dual' && uploadedFileA && uploadedFileB) return true
        if (showDemo) return true
        return false
      case 3: // 隐喻选择
        return dataAnalysis !== null
      case 4: // 生成输出
        return dataAnalysis !== null && selectedMetaphor !== null
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 渐变装饰 */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-40 -top-40 size-80 rounded-full bg-gradient-to-r from-amber-200 to-orange-100 opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-gradient-to-r from-sky-200 to-cyan-100 opacity-20 blur-3xl"></div>
      </div>

      {/* 导航栏 */}
      <nav className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-sky-600 shadow-lg">
                <span className="text-lg font-bold text-white">M</span>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">
                  MetaphorAI
                </span>
                <div className="text-xs font-medium text-gray-500">
                  智能数据对比叙事系统
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 rounded-full bg-gradient-to-r from-amber-50 to-sky-50 px-4 py-2">
              <div className="size-2 animate-pulse rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-700">
                支持单文件/双文件分析
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* 标题区域 */}
        <section className="mb-16 text-center">
          <div className="mb-6 inline-block rounded-full bg-gradient-to-r from-amber-100 via-purple-100 to-sky-100 px-4 py-1">
            <span className="text-sm font-semibold text-gray-700">
              基于概念隐喻理论 (CMT) 与AI分析
            </span>
          </div>
          <h1 className="mb-6 bg-gradient-to-r from-amber-600 via-purple-600 to-sky-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
            {typedText}
            {isTyping && (
              <span className="ml-2 inline-block h-12 w-1 animate-pulse bg-gradient-to-b from-amber-500 to-sky-500"></span>
            )}
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600">
            智能分析数据中的对比特征，通过四种概念隐喻生成单张视觉对比叙事图像，让数据讲述生动的对比故事
          </p>
        </section>

        {/* 进度指示器 */}
        <section className="mb-12">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-between">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex flex-col items-center">
                  <div
                    className={`flex size-12 items-center justify-center rounded-full border-2 ${
                      activeStep >= step
                        ? 'border-blue-500 bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg'
                        : 'border-gray-300 bg-white text-gray-400'
                    } transition-all duration-300`}
                  >
                    {step}
                  </div>
                  <span
                    className={`mt-2 text-sm font-medium ${
                      activeStep >= step ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {['数据输入', '数据分析', '隐喻选择', '生成输出'][step - 1]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 主操作区 */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* 左侧：输入和配置 */}
          <div className="space-y-8">
            {/* 上传模式选择 */}
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-blue-50/20 p-6 shadow-xl backdrop-blur-sm">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  选择分析模式
                </h2>
                <p className="text-gray-500">
                  根据您的数据格式选择合适的分析方式
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setUploadMode('single')}
                  className={`rounded-xl border-2 p-4 transition-all duration-300 ${
                    uploadMode === 'single'
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-white shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`mr-3 flex size-10 items-center justify-center rounded-lg ${
                        uploadMode === 'single'
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <span className="text-lg">📁</span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">
                        单文件分析
                      </div>
                      <div className="text-xs text-gray-500">
                        系统自动提取对比特征
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setUploadMode('dual')}
                  className={`rounded-xl border-2 p-4 transition-all duration-300 ${
                    uploadMode === 'dual'
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-white shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`mr-3 flex size-10 items-center justify-center rounded-lg ${
                        uploadMode === 'dual'
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <span className="text-lg">📁📁</span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">
                        双文件对比
                      </div>
                      <div className="text-xs text-gray-500">
                        直接对比两组数据
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-6 rounded-lg bg-gradient-to-r from-amber-50 to-sky-50 p-4">
                <div className="flex items-center">
                  <div className="mr-3 flex size-8 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-400">
                    <span className="text-sm text-white">ℹ️</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    {uploadMode === 'single'
                      ? '单文件模式：上传包含多组数据的文件，系统自动识别关键对比特征'
                      : '双文件模式：分别上传两个文件，系统直接进行对比分析'}
                  </div>
                </div>
              </div>
            </div>

            {/* 数据上传区域 */}
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-blue-50/20 p-8 shadow-xl backdrop-blur-sm">
              <div className="mb-6 flex items-center space-x-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-sky-500">
                  <span className="text-lg font-bold text-white">1</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {uploadMode === 'single' ? '数据文件上传' : '对比数据上传'}
                  </h2>
                  <p className="text-gray-500">
                    {uploadMode === 'single'
                      ? '上传包含对比数据的文件（CSV/Excel/JSON）'
                      : '上传两个对比数据文件'}
                  </p>
                </div>
              </div>

              {!showDemo ? (
                <div className="space-y-6">
                  {uploadMode === 'single' ? (
                    // 单文件上传
                    <div className="group relative rounded-xl border-2 border-dashed border-gray-300 p-8 text-center transition-all hover:border-blue-400 hover:bg-blue-50/30">
                      <div className="relative mb-4 flex justify-center">
                        <div className="rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 p-4">
                          <div className="text-4xl text-blue-600">📊</div>
                        </div>
                      </div>
                      <p className="mb-3 font-medium text-gray-700">
                        上传数据文件
                      </p>
                      <p className="mb-4 text-sm text-gray-500">
                        支持 CSV、Excel、JSON
                        格式，系统将自动分析数据中的对比特征
                      </p>
                      <label className="relative inline-block cursor-pointer">
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls,.json"
                          onChange={handleSingleFileUpload}
                          className="hidden"
                        />
                        <div className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105">
                          {uploadedFile ? '重新选择文件' : '选择数据文件'}
                        </div>
                      </label>
                      {uploadedFile && (
                        <div className="mt-4">
                          <div className="inline-flex items-center rounded-full bg-green-100 px-4 py-2">
                            <span className="mr-2 text-green-600">✓</span>
                            <span className="font-medium text-green-700">
                              {uploadedFile.name}
                            </span>
                            <button
                              onClick={() => removeFile('single')}
                              className="ml-3 text-sm text-gray-500 hover:text-red-500"
                            >
                              移除
                            </button>
                          </div>
                          <p className="mt-2 text-sm text-gray-500">
                            文件大小：{(uploadedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    // 双文件上传
                    <>
                      <div className="space-y-4">
                        <div className="group relative rounded-xl border-2 border-dashed border-amber-300 p-6 text-center transition-all hover:border-amber-400 hover:bg-amber-50/30">
                          <div className="relative mb-4 flex justify-center">
                            <div className="rounded-full bg-gradient-to-r from-amber-100 to-orange-100 p-3">
                              <div className="text-3xl text-amber-600">📁</div>
                            </div>
                          </div>
                          <p className="mb-3 font-medium text-gray-700">
                            数据文件A
                          </p>
                          <label className="relative inline-block cursor-pointer">
                            <input
                              type="file"
                              accept=".csv,.xlsx,.xls,.json"
                              onChange={(e) =>
                                handleDualFileUpload(e, 'groupA')
                              }
                              className="hidden"
                            />
                            <div className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2 font-semibold text-white shadow-lg transition-transform hover:scale-105">
                              {uploadedFileA ? '重新选择' : '上传文件A'}
                            </div>
                          </label>
                          {uploadedFileA && (
                            <div className="mt-2">
                              <p className="text-sm text-green-600">
                                ✓ {uploadedFileA.name}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="group relative rounded-xl border-2 border-dashed border-sky-300 p-6 text-center transition-all hover:border-sky-400 hover:bg-sky-50/30">
                          <div className="relative mb-4 flex justify-center">
                            <div className="rounded-full bg-gradient-to-r from-sky-100 to-cyan-100 p-3">
                              <div className="text-3xl text-sky-600">📁</div>
                            </div>
                          </div>
                          <p className="mb-3 font-medium text-gray-700">
                            数据文件B
                          </p>
                          <label className="relative inline-block cursor-pointer">
                            <input
                              type="file"
                              accept=".csv,.xlsx,.xls,.json"
                              onChange={(e) =>
                                handleDualFileUpload(e, 'groupB')
                              }
                              className="hidden"
                            />
                            <div className="rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 px-6 py-2 font-semibold text-white shadow-lg transition-transform hover:scale-105">
                              {uploadedFileB ? '重新选择' : '上传文件B'}
                            </div>
                          </label>
                          {uploadedFileB && (
                            <div className="mt-2">
                              <p className="text-sm text-green-600">
                                ✓ {uploadedFileB.name}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 文件状态指示器 */}
                      {(uploadedFileA || uploadedFileB) && (
                        <div className="rounded-xl bg-gradient-to-r from-amber-50 via-purple-50 to-sky-50 p-4">
                          <div className="flex justify-between">
                            <div
                              className={`flex items-center ${
                                uploadedFileA
                                  ? 'text-amber-600'
                                  : 'text-gray-500'
                              }`}
                            >
                              <span className="mr-2">
                                {uploadedFileA ? '✓' : '○'}
                              </span>
                              <span>文件A</span>
                              {uploadedFileA && (
                                <button
                                  onClick={() => removeFile('groupA')}
                                  className="ml-2 text-xs text-gray-500 hover:text-red-500"
                                >
                                  移除
                                </button>
                              )}
                            </div>
                            <div className="flex items-center text-gray-400">
                              <span className="mx-2">vs</span>
                            </div>
                            <div
                              className={`flex items-center ${
                                uploadedFileB ? 'text-sky-600' : 'text-gray-500'
                              }`}
                            >
                              <span className="mr-2">
                                {uploadedFileB ? '✓' : '○'}
                              </span>
                              <span>文件B</span>
                              {uploadedFileB && (
                                <button
                                  onClick={() => removeFile('groupB')}
                                  className="ml-2 text-xs text-gray-500 hover:text-red-500"
                                >
                                  移除
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="text-center">
                    <button
                      onClick={handleViewDemo}
                      className="inline-flex items-center space-x-2 font-medium text-blue-600 hover:text-blue-700"
                    >
                      <span>使用演示数据</span>
                      <span className="text-lg">→</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <DataChart />
                  <button
                    onClick={() => {
                      setShowDemo(false)
                      setUploadedFile(null)
                      setUploadedFileA(null)
                      setUploadedFileB(null)
                      setDataAnalysis(null)
                      setNarrativeResult('')
                      setGeneratedImage(null)
                    }}
                    className="mt-6 flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  >
                    <span>← 返回上传数据</span>
                  </button>
                </div>
              )}
            </div>

            {/* 第二步：数据分析区域 */}
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-green-50/20 p-8 shadow-xl backdrop-blur-sm">
              <div className="mb-6 flex items-center space-x-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
                  <span className="text-lg font-bold text-white">2</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">数据分析</h2>
                  <p className="text-gray-500">分析数据特征，提取对比关系</p>
                </div>
              </div>

              {/* 数据分析按钮 */}
              {canProceedToStep(2) ? (
                <button
                  onClick={analyzeData}
                  disabled={isAnalyzingData}
                  className={`group relative w-full overflow-hidden rounded-2xl py-4 text-lg font-bold transition-all duration-300 ${
                    isAnalyzingData
                      ? 'cursor-not-allowed bg-gray-400'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-2xl hover:shadow-green-500/30'
                  }`}
                >
                  <div className="relative z-10">
                    {isAnalyzingData ? (
                      <div className="flex items-center justify-center">
                        <div className="mr-3 size-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        正在分析数据特征...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span className="mr-2">🔍</span>
                        分析数据特征
                      </div>
                    )}
                  </div>
                </button>
              ) : (
                <div className="rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 p-6 text-center">
                  <div className="mb-4 text-gray-600">
                    {uploadMode === 'single'
                      ? '请先上传数据文件'
                      : '请先上传两个对比文件'}
                  </div>
                  <div className="text-sm text-gray-500">
                    完成文件上传后，才能进行数据分析
                  </div>
                </div>
              )}

              {/* 显示分析结果概要 */}
              {dataAnalysis && (
                <div className="mt-6 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                  <div className="mb-2 flex items-center">
                    <div className="mr-2 flex size-6 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-emerald-400">
                      <span className="text-xs text-white">✓</span>
                    </div>
                    <span className="font-semibold text-gray-800">
                      数据分析完成
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    已识别 {dataAnalysis.comparisonItems.length} 个对比项
                  </p>
                  <button
                    onClick={() => setActiveStep(3)}
                    className="mt-3 w-full rounded-lg bg-gradient-to-r from-green-400 to-emerald-500 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg"
                  >
                    继续选择隐喻类型 →
                  </button>
                </div>
              )}
            </div>

            {/* 第三步：隐喻选择区域 - 始终显示 */}
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-purple-50/20 p-8 shadow-xl backdrop-blur-sm">
              <div className="mb-6 flex items-center space-x-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-600">
                  <span className="text-lg font-bold text-white">3</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    选择隐喻类型
                  </h2>
                  <p className="text-gray-500">选择数据对比的视觉叙事框架</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {metaphorTypes.map((metaphor) => (
                  <div
                    key={metaphor.id}
                    className={`group relative cursor-pointer rounded-xl border-2 p-5 transition-all duration-300 ${
                      selectedMetaphor === metaphor.id
                        ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-white shadow-lg'
                        : canProceedToStep(3)
                          ? 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                          : 'cursor-not-allowed border-gray-100 opacity-50'
                    }`}
                    onClick={() => {
                      if (canProceedToStep(3)) {
                        setSelectedMetaphor(metaphor.id)
                      }
                    }}
                  >
                    {selectedMetaphor === metaphor.id && (
                      <div className="absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                        <span className="text-white">✓</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <div
                        className={`mr-4 flex size-14 items-center justify-center rounded-xl bg-gradient-to-r ${
                          metaphor.color
                        } text-2xl shadow-md ${
                          !canProceedToStep(3) ? 'opacity-50' : ''
                        }`}
                      >
                        {metaphor.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-gray-900">
                            {metaphor.name}
                          </h3>
                          {!canProceedToStep(3) ? (
                            <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-400">
                              需先分析数据
                            </div>
                          ) : (
                            <div
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                selectedMetaphor === metaphor.id
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              点击选择
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-gray-600">
                          {metaphor.description}
                        </p>
                        <div className="mt-2 text-sm italic text-gray-500">
                          {metaphor.example}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {!canProceedToStep(3) && (
                <div className="mt-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 p-4">
                  <div className="flex items-center">
                    <div className="mr-3 flex size-6 items-center justify-center rounded-full bg-gradient-to-r from-gray-400 to-gray-500">
                      <span className="text-xs text-white">⏳</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      请先完成数据分析，才能选择隐喻类型
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 第四步：生成按钮 - 始终显示 */}
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-amber-50/20 p-8 shadow-xl backdrop-blur-sm">
              <div className="mb-6 flex items-center space-x-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500">
                  <span className="text-lg font-bold text-white">4</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    生成对比叙事
                  </h2>
                  <p className="text-gray-500">生成数据对比分析和视觉图像</p>
                </div>
              </div>

              <button
                onClick={handleGenerateNarrative}
                disabled={!canProceedToStep(4) || isGenerating}
                className={`group relative w-full overflow-hidden rounded-2xl py-5 text-xl font-bold transition-all duration-300 ${
                  !canProceedToStep(4) || isGenerating
                    ? 'cursor-not-allowed bg-gray-400'
                    : 'bg-gradient-to-r from-amber-500 via-purple-500 to-sky-500 text-white hover:shadow-2xl hover:shadow-blue-500/30'
                }`}
              >
                <div className="relative z-10">
                  {isGenerating ? (
                    <div className="flex items-center justify-center">
                      <div className="mr-3 size-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      正在生成对比叙事...
                    </div>
                  ) : !canProceedToStep(4) ? (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">🔒</span>
                      请先完成前序步骤
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">🎨</span>
                      生成单图对比叙事
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
              </button>

              {!canProceedToStep(4) && (
                <div className="mt-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                  <div className="flex items-center">
                    <div className="mr-3 flex size-6 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-400">
                      <span className="text-xs text-white">ℹ️</span>
                    </div>
                    <p className="text-sm text-gray-700">需要完成以下步骤：</p>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div
                      className={`flex items-center text-sm ${
                        uploadMode === 'single' && uploadedFile
                          ? 'text-green-600'
                          : 'text-gray-500'
                      }`}
                    >
                      <span className="mr-2">
                        {uploadMode === 'single' && uploadedFile ? '✓' : '○'}
                      </span>
                      上传数据文件
                    </div>
                    <div
                      className={`flex items-center text-sm ${
                        dataAnalysis ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      <span className="mr-2">{dataAnalysis ? '✓' : '○'}</span>
                      完成数据分析
                    </div>
                    <div
                      className={`flex items-center text-sm ${
                        selectedMetaphor ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      <span className="mr-2">
                        {selectedMetaphor ? '✓' : '○'}
                      </span>
                      选择隐喻类型
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：输出结果 */}
          <div className="space-y-8">
            {/* 结果展示区域 */}
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-amber-50/20 p-8 shadow-xl backdrop-blur-sm">
              <div className="mb-6 flex items-center space-x-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500">
                  <span className="text-lg font-bold text-white">结果</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    对比叙事结果
                  </h2>
                  <p className="text-gray-500">查看生成的数据对比分析和图像</p>
                </div>
              </div>

              {isAnalyzingData ? (
                <div className="py-12 text-center">
                  <div className="relative mx-auto mb-6">
                    <div className="absolute inset-0 animate-ping rounded-full bg-gradient-to-r from-green-400 to-emerald-400 opacity-20"></div>
                    <div className="relative flex size-24 items-center justify-center rounded-full bg-gradient-to-r from-green-100 to-emerald-100">
                      <div className="size-16 animate-spin rounded-full border-4 border-green-200 border-t-emerald-500"></div>
                    </div>
                  </div>
                  <p className="text-lg font-medium text-gray-700">
                    正在分析数据特征...
                  </p>
                  <p className="mt-2 text-gray-500">
                    系统正在识别数据中的关键对比特征
                  </p>
                  <div className="mt-6 space-y-3">
                    <div className="mx-auto h-2 w-48 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full w-3/4 animate-pulse rounded-full bg-gradient-to-r from-green-400 to-emerald-400"></div>
                    </div>
                    <div className="text-sm text-gray-500">
                      提取对比项 · 分析趋势 · 识别特征
                    </div>
                  </div>
                </div>
              ) : isGenerating ? (
                <div className="space-y-8 py-8">
                  {/* 文本生成指示器 */}
                  <div className="text-center">
                    <div className="relative mx-auto mb-6">
                      <div className="absolute inset-0 animate-ping rounded-full bg-gradient-to-r from-amber-400 via-purple-400 to-sky-400 opacity-20"></div>
                      <div className="relative flex size-24 items-center justify-center rounded-full bg-gradient-to-r from-amber-100 via-purple-100 to-sky-100">
                        <div className="size-16 animate-spin rounded-full border-4 border-amber-200 border-t-sky-500"></div>
                      </div>
                    </div>
                    <p className="text-lg font-medium text-gray-700">
                      AI正在生成单图对比叙事...
                    </p>
                    <p className="mt-2 text-gray-500">
                      正在基于分析结果构建视觉叙事场景
                    </p>
                  </div>

                  {/* 图像生成指示器 */}
                  <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-6">
                    <div className="mb-4 flex items-center">
                      <div className="mr-3 flex size-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                        <span className="text-xl text-white">🖼️</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">
                          生成单张对比图像
                        </h4>
                        <p className="text-sm text-gray-600">
                          基于选择的隐喻类型和数据分析结果生成对比图像
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-white p-6 text-center">
                      <div className="mb-4 flex justify-center">
                        <div className="relative size-32">
                          <div className="absolute left-0 top-0 size-32 animate-pulse rounded-l-full bg-gradient-to-r from-amber-200 to-orange-100"></div>
                          <div className="absolute right-0 top-0 size-32 animate-pulse rounded-r-full bg-gradient-to-r from-sky-200 to-cyan-100 delay-300"></div>
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl">
                            🆚
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-purple-600">
                        生成中：左侧特征A · 右侧特征B · 视觉对比
                      </div>
                    </div>
                  </div>
                </div>
              ) : narrativeResult ? (
                <div className="space-y-8">
                  {/* 先显示表格理解（如果存在） */}
                  {dataAnalysis && dataAnalysis.table_understanding && (
                    <div className="mb-6">
                      {renderTableUnderstanding(dataAnalysis)}
                    </div>
                  )}

                  {/* 渲染优化后的文本内容 */}
                  <div
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: narrativeResult }}
                  />

                  {generatedImage && (
                    <div>
                      <div className="mb-6 text-center">
                        <div className="inline-flex items-center space-x-4 rounded-full bg-gradient-to-r from-amber-50 via-purple-50 to-sky-50 px-6 py-2">
                          <div className="flex items-center">
                            <div className="mr-2 size-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"></div>
                            <span className="font-medium text-amber-600">
                              特征A
                            </span>
                          </div>
                          <div className="text-gray-400">🆚</div>
                          <div className="flex items-center">
                            <div className="mr-2 size-3 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400"></div>
                            <span className="font-medium text-sky-600">
                              特征B
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-2xl transition-all hover:shadow-2xl">
                        <div className="relative aspect-video overflow-hidden">
                          <img
                            src={generatedImage.url}
                            alt={generatedImage.description}
                            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = getFallbackImage()
                            }}
                          />
                          {/* 对比标识 */}
                          <div className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-amber-600/10 to-transparent"></div>
                          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-sky-600/10 to-transparent"></div>

                          <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="mr-3 text-2xl">📊</span>
                                <div>
                                  <div className="font-bold text-white">
                                    特征A
                                  </div>
                                  <div className="text-sm text-amber-200">
                                    左侧 · 暖色调
                                  </div>
                                </div>
                              </div>
                              <div className="rounded-full bg-black/40 px-4 py-1">
                                <span className="text-lg font-bold text-white">
                                  🆚
                                </span>
                              </div>
                              <div className="flex items-center">
                                <div className="text-right">
                                  <div className="font-bold text-white">
                                    特征B
                                  </div>
                                  <div className="text-sm text-sky-200">
                                    右侧 · 冷色调
                                  </div>
                                </div>
                                <span className="ml-3 text-2xl">📈</span>
                              </div>
                            </div>
                          </div>

                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                            <div className="flex justify-center">
                              <div className="rounded-full bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-sky-500/20 px-4 py-2 backdrop-blur-sm">
                                <span className="font-semibold text-white">
                                  {
                                    metaphorTypes.find(
                                      (m) => m.id === selectedMetaphor
                                    )?.name
                                  }
                                  对比叙事
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                          <h3 className="mb-3 text-xl font-bold text-gray-900">
                            {generatedImage.description}
                          </h3>
                          <div className="mb-4 grid grid-cols-2 gap-4">
                            <div className="rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 p-3">
                              <div className="mb-1 flex items-center">
                                <div className="mr-2 size-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"></div>
                                <div className="text-sm font-semibold text-amber-700">
                                  特征A视觉映射
                                </div>
                              </div>
                              <div className="text-xs text-gray-600">
                                暖色调 · 稳定形态 · 左侧布局
                              </div>
                            </div>
                            <div className="rounded-lg bg-gradient-to-br from-sky-50 to-cyan-50 p-3">
                              <div className="mb-1 flex items-center">
                                <div className="mr-2 size-3 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400"></div>
                                <div className="text-sm font-semibold text-sky-700">
                                  特征B视觉映射
                                </div>
                              </div>
                              <div className="text-xs text-gray-600">
                                冷色调 · 变化形态 · 右侧布局
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              // 显示提示词详情
                              alert(
                                `对比图像提示词详情：\n\n${generatedImage.prompt}`
                              )
                            }}
                            className="w-full rounded-lg bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 text-sm font-medium text-gray-700 hover:from-gray-200 hover:to-gray-100"
                          >
                            🔍 查看生成提示词
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col space-y-4 border-t border-gray-200 pt-6 sm:flex-row sm:space-x-4 sm:space-y-0">
                    {/* 导出分析报告按钮 */}
                    <button
                      onClick={() => {
                        const metaphorName =
                          metaphorTypes.find((m) => m.id === selectedMetaphor)
                            ?.name || ''
                        const analysis = dataAnalysis || {
                          comparisonItems: ['特征A vs 特征B'],
                          trends: ['数据呈现对比特征'],
                          summary: '数据展现对比关系。'
                        }

                        const content = `# 数据对比叙事报告_${
                          new Date().toISOString().split('T')[0]
                        }
## 分析类型：${metaphorName}
## 数据对比概览
${analysis.summary}
## 关键对比项
${analysis.comparisonItems.map((item) => `- ${item}`).join('\n')}
## 趋势特征
${analysis.trends.map((trend) => `- ${trend}`).join('\n')}
## 生成的对比图像
- 描述：${generatedImage?.description || '未生成'}
- 提示词：${generatedImage?.prompt || '无'}
- 图像URL：${generatedImage?.url || '无'}`

                        const blob = new Blob([content], {
                          type: 'text/markdown'
                        })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `数据对比叙事_${
                          new Date().toISOString().split('T')[0]
                        }.md`
                        a.click()
                      }}
                      className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-sky-600 px-6 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105"
                    >
                      📥 导出分析报告
                    </button>

                    {/* 导出图片按钮 */}
                    {generatedImage && generatedImage.url && (
                      <button
                        onClick={() =>
                          handleExportImage(
                            generatedImage.url,
                            generatedImage.description
                          )
                        }
                        disabled={isGenerating}
                        className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isGenerating ? (
                          <>
                            <span className="mr-2 animate-spin">⏳</span>
                            准备导出...
                          </>
                        ) : (
                          <>
                            <span className="mr-2">🖼️</span>
                            保存图片
                          </>
                        )}
                      </button>
                    )}

                    {/* 重新生成按钮 */}
                    <button
                      onClick={() => {
                        setNarrativeResult('')
                        setGeneratedImage(null)
                        setActiveStep(3)
                      }}
                      className="flex-1 rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-transform hover:scale-105 hover:bg-gray-50"
                    >
                      🔄 重新生成
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center">
                  <div className="relative mx-auto mb-6">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-amber-100 via-purple-100 to-sky-100"></div>
                    <div className="relative flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-white to-purple-50">
                      <div className="text-4xl">📊</div>
                    </div>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-gray-900">
                    等待生成对比叙事
                  </h3>
                  <p className="text-gray-600">
                    {uploadMode === 'single'
                      ? '上传数据文件并分析特征后，将在此处生成单图对比叙事'
                      : '上传两个对比文件并分析特征后，将在此处生成单图对比叙事'}
                  </p>
                  <div className="mt-6 inline-block rounded-full bg-gradient-to-r from-amber-100 via-purple-100 to-sky-100 px-4 py-2">
                    <span className="text-sm font-medium text-gray-700">
                      智能分析 → 概念隐喻 → 视觉叙事
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 理论说明 */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-gray-900 p-8 text-white shadow-2xl">
              <h2 className="mb-4 text-2xl font-bold">系统工作流程</h2>
              <div className="space-y-4">
                <div className="rounded-xl bg-gradient-to-r from-amber-900/50 via-purple-900/50 to-sky-900/50 p-4">
                  <h3 className="mb-2 font-bold text-amber-300">
                    1. 智能数据分析
                  </h3>
                  <p className="text-sm text-gray-300">
                    自动分析数据文件，提取关键对比特征、趋势差异和统计关系。
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-4">
                  <h3 className="mb-2 font-bold text-purple-300">
                    2. 概念隐喻映射
                  </h3>
                  <p className="text-sm text-gray-300">
                    根据数据特征选择合适的隐喻类型，将数据关系映射为视觉元素和叙事结构。
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-r from-emerald-900/50 to-green-900/50 p-4">
                  <h3 className="mb-2 font-bold text-emerald-300">
                    3. AI视觉生成
                  </h3>
                  <p className="text-sm text-gray-300">
                    基于隐喻提示词生成单张对比图像，展现数据特征的视觉对比关系。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="mt-16 bg-gradient-to-br from-slate-900 to-gray-900 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <div className="mb-6 inline-block rounded-full bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-sky-500/20 px-6 py-2">
              <h3 className="text-lg font-bold text-white">
                智能数据对比叙事系统
              </h3>
            </div>
            <p className="mb-4 text-2xl font-bold text-white">
              《基于概念隐喻的泛化数据对比叙事生成》
            </p>
            <div className="mt-8 flex justify-center space-x-6">
              <div className="rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 py-2">
                <div className="text-sm text-amber-300">智能分析</div>
                <div className="font-medium text-white">
                  单文件/双文件 · 自动特征提取
                </div>
              </div>
              <div className="rounded-lg bg-gradient-to-r from-sky-500/10 to-cyan-500/10 px-4 py-2">
                <div className="text-sm text-sky-300">概念隐喻</div>
                <div className="font-medium text-white">
                  四种映射 · 视觉叙事框架
                </div>
              </div>
              <div className="rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-4 py-2">
                <div className="text-sm text-purple-300">AI生成</div>
                <div className="font-medium text-white">
                  单图对比 · 视觉叙事表达
                </div>
              </div>
            </div>
            <p className="mt-8 text-sm text-gray-400">
              © 2026 毕业设计 · 泛化数据对比叙事实验室
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
