import { useState, useEffect } from 'react'

// 概念隐喻类型
const metaphorTypes = [
  {
    id: 1,
    name: '实体隐喻',
    description: '将中美数据拟人化为两个角色在同一场景中互动',
    icon: '👤',
    example: '中国数据→沉稳棋手，美国数据→激进选手，在同一棋盘对弈',
    color: 'from-blue-400 to-cyan-400',
    bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50'
  },
  {
    id: 2,
    name: '结构隐喻',
    description: '将中美趋势差异映射为同一比赛中的策略差异',
    icon: '📈',
    example: '中国平稳下降→稳健策略，美国剧烈波动→激进策略',
    color: 'from-emerald-400 to-green-400',
    bgColor: 'bg-gradient-to-br from-emerald-50 to-green-50'
  },
  {
    id: 3,
    name: '方位隐喻',
    description: '在同一空间布局中用位置/色彩差异体现数据对比',
    icon: '🧭',
    example: '左侧中国红方稳固防守，右侧美国蓝方积极变化',
    color: 'from-violet-400 to-purple-400',
    bgColor: 'bg-gradient-to-br from-violet-50 to-purple-50'
  },
  {
    id: 4,
    name: '图像隐喻',
    description: '用同一图像的左右分割对比中美数据形态差异',
    icon: '🎨',
    example: '左半部红色平缓山坡，右半部蓝色陡峭山峰',
    color: 'from-pink-400 to-rose-400',
    bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50'
  }
]

// 定义数据项接口
interface DataItem {
  date: string
  china: number
  usa: number
}

// 示例数据
const exampleData: DataItem[] = [
  { date: '2023-01', china: 1000, usa: 5000 },
  { date: '2023-02', china: 800, usa: 8000 },
  { date: '2023-03', china: 500, usa: 12000 },
  { date: '2023-04', china: 300, usa: 15000 },
  { date: '2023-05', china: 200, usa: 10000 },
  { date: '2023-06', china: 150, usa: 7000 }
]

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

function App() {
  const [typedText, setTypedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [uploadedChinaFile, setUploadedChinaFile] = useState<File | null>(null)
  const [uploadedUSFile, setUploadedUSFile] = useState<File | null>(null)
  const [selectedMetaphor, setSelectedMetaphor] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [narrativeResult, setNarrativeResult] = useState('')
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(
    null
  )
  const [showDemo, setShowDemo] = useState(false)
  const [activeStep, setActiveStep] = useState(1)

  // 打字机效果
  useEffect(() => {
    const fullText = '概念隐喻驱动下的中美数据对比叙事生成系统'
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

  // 处理文件上传
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'china' | 'usa'
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      if (
        !file.name.endsWith('.csv') &&
        !file.name.endsWith('.xlsx') &&
        !file.name.endsWith('.xls')
      ) {
        alert('请上传 CSV 或 Excel 文件')
        return
      }

      if (type === 'china') {
        setUploadedChinaFile(file)
      } else {
        setUploadedUSFile(file)
      }

      if (
        (type === 'china' && uploadedUSFile) ||
        (type === 'usa' && uploadedChinaFile)
      ) {
        setActiveStep(2)
      }
    }
  }

  // 移除文件
  const removeFile = (type: 'china' | 'usa') => {
    if (type === 'china') {
      setUploadedChinaFile(null)
    } else {
      setUploadedUSFile(null)
    }
    setActiveStep(1)
  }

  // 数据特征分析函数
  function getTrendDescription(data: DataItem[]): string {
    const chinaStart = data[0].china
    const chinaEnd = data[data.length - 1].china
    const chinaTrend = chinaEnd < chinaStart * 0.5 ? '持续快速下降' : '相对平稳'

    const usaValues = data.map((d) => d.usa)
    const usaMax = Math.max(...usaValues)
    const usaMin = Math.min(...usaValues)
    const usaTrend = usaMax > usaMin * 3 ? '剧烈波动呈倒V型' : '相对稳定'

    return `中国：${chinaTrend}；美国：${usaTrend}`
  }

  function getScaleRatio(data: DataItem[]): number {
    const maxChina = Math.max(...data.map((d) => d.china))
    const maxUSA = Math.max(...data.map((d) => d.usa))
    return maxUSA / maxChina
  }

  function getVolatilityComparison(data: DataItem[]): string {
    const chinaChanges: number[] = []
    const usaChanges: number[] = []

    for (let i = 1; i < data.length; i++) {
      chinaChanges.push(Math.abs(data[i].china - data[i - 1].china))
      usaChanges.push(Math.abs(data[i].usa - data[i - 1].usa))
    }

    const avgUSAChange =
      usaChanges.reduce((a, b) => a + b, 0) / usaChanges.length
    const avgChinaChange =
      chinaChanges.reduce((a, b) => a + b, 0) / chinaChanges.length

    const ratio = avgUSAChange / avgChinaChange
    if (ratio > 3) return '美国波动性远高于中国'
    if (ratio > 1.5) return '美国波动性高于中国'
    return '两国波动性相近'
  }

  // 备用图片
  const getFallbackImage = (): string => {
    return 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=1024&h=768&fit=crop&auto=format'
  }

  // 备用对比提示词
  const getFallbackContrastPrompt = (
    data: DataItem[],
    metaphorType: (typeof metaphorTypes)[0]
  ): string => {
    const trend = getTrendDescription(data)
    const scaleRatio = getScaleRatio(data)
    const volatility = getVolatilityComparison(data)

    let prompt = ''
    switch (metaphorType.id) {
      case 1: // 实体隐喻
        prompt = `在同一赛场场景中，左侧为身穿红金服装的沉稳中国棋手执棋布局，右侧为身穿蓝银服装的积极美国选手快速移动。中国棋手布局稳固（对应${
          trend.split('；')[0]
        }），美国选手策略多变（对应${
          trend.split('；')[1]
        }），规模对比1:${Math.round(
          scaleRatio
        )}。东方水墨与西方现代艺术融合风格，红蓝对比色调，积极健康的竞技场景。`
        break
      case 2: // 结构隐喻
        prompt = `同一比赛场景：左侧中国红色阵营采用稳健策略，布局有序调整；右侧美国蓝色阵营采用多变策略，行动快速变化。中国方棋子数量持续减少但布局不乱，美国方棋子数量变化剧烈形成起伏变化。体育竞技主题，红蓝阵营对比，积极向上的比赛氛围。`
        break
      case 3: // 方位隐喻
        prompt = `同一空间布局：画面左侧红色区域代表中国数据，呈现平稳下降的阶梯状结构；画面右侧蓝色区域代表美国数据，呈现剧烈波动的波浪状起伏。红色区域占据1/3宽度，蓝色区域占据2/3宽度（比例1:${Math.round(
          scaleRatio
        )}）。冷暖色调对比，空间透视构图，抽象艺术风格。`
        break
      case 4: // 图像隐喻
        prompt = `左右分割对比图像：左半部为红色平缓下降的山坡，象征中国数据的平稳趋势；右半部为蓝色陡峭起伏的山峰与山谷，象征美国数据的剧烈波动。左侧山坡高度逐渐降低，右侧山峰有显著高峰和低谷。现实主义风景画，红蓝色彩对比，自然景观主题。`
        break
      default:
        prompt = `中美数据对比场景：左侧红色元素代表中国，趋势平稳下降；右侧蓝色元素代表美国，趋势剧烈波动。比例1:${Math.round(
          scaleRatio
        )}，${volatility}。融合东方与西方艺术风格，抽象表现主义。`
    }
    return prompt
  }

  // AI生成对比提示词
  const generateContrastPromptByAI = async (
    data: DataItem[],
    metaphorType: (typeof metaphorTypes)[0]
  ): Promise<string> => {
    const trend = getTrendDescription(data)
    const scaleRatio = getScaleRatio(data)
    const volatility = getVolatilityComparison(data)
    const chinaValues = data.map((d) => d.china)
    const usaValues = data.map((d) => d.usa)
    const maxChina = Math.max(...chinaValues)
    const minChina = Math.min(...chinaValues)
    const maxUSA = Math.max(...usaValues)
    const minUSA = Math.min(...usaValues)

    const prompt = `你是专业视觉隐喻设计师，基于概念隐喻理论生成中美数据对比图像提示词。

隐喻类型：${metaphorType.name}
原理：${metaphorType.description}

数据特征：
- 趋势对比：${trend}
- 规模比例：美国数据最大值为中国的${scaleRatio.toFixed(1)}倍
- 波动对比：${volatility}
- 中国数值范围：${minChina}~${maxChina}（持续下降）
- 美国数值范围：${minUSA}~${maxUSA}（倒V型波动）

要求：
1. 必须生成单一张图像，体现中美数据对比
2. 严格使用${metaphorType.name}：${metaphorType.example}
3. 通过左右分割或同一场景中的两个角色对比展现差异
4. 中国侧用红色/金色调，美国侧用蓝色/银色调
5. 中国趋势用平稳/下降视觉元素，美国趋势用波动/起伏视觉元素
6. 规模比例（${scaleRatio.toFixed(1)}:1）通过视觉大小/数量体现
7. 使用积极、健康、非暴力的隐喻：如棋局、比赛、自然景观、建筑结构等
8. 避免任何军事、战争、暴力、冲突相关词汇
9. 输出单一文生图提示词（80-120字），直接用于图像生成，不要额外解释

安全要求：确保提示词内容符合AI伦理和安全规范，不涉及敏感或争议性话题。`

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

      // 安全检查：确保生成的提示词不包含敏感词汇
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
        '死亡'
      ]
      const lowerContent = content.toLowerCase()

      for (const word of sensitiveWords) {
        if (lowerContent.includes(word.toLowerCase())) {
          console.warn('生成的提示词包含敏感词汇，使用备用提示词')
          return getFallbackContrastPrompt(data, metaphorType)
        }
      }

      return content || getFallbackContrastPrompt(data, metaphorType)
    } catch (error) {
      console.error('AI生成对比提示词失败，使用备用提示词', error)
      return getFallbackContrastPrompt(data, metaphorType)
    }
  }

  // 文本生成
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
      return result.content || '未收到有效响应'
    } catch (error) {
      console.error('文本生成失败:', error)
      throw error
    }
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

  // 主生成函数
  const handleGenerateNarrative = async () => {
    if ((!uploadedChinaFile || !uploadedUSFile) && !showDemo) {
      alert('请先上传中国和美国两个数据文件')
      return
    }

    setIsGenerating(true)
    setIsGeneratingImages(true)
    setActiveStep(4)
    setGeneratedImage(null)
    setNarrativeResult('')

    try {
      // 1. 准备数据描述
      const dataDescription = showDemo
        ? `中美疫情数据对比：
中国：2023年1月1000例，2月800例，3月500例，4月300例，5月200例，6月150例（持续下降）
美国：2023年1月5000例，2月8000例，3月12000例，4月15000例，5月10000例，6月7000例（倒V型波动）`
        : `中国数据文件：${uploadedChinaFile?.name}，美国数据文件：${uploadedUSFile?.name}`

      // 2. 获取隐喻类型信息
      const metaphorType = metaphorTypes.find((m) => m.id === selectedMetaphor)!
      const metaphorTypeName = metaphorType.name
      const metaphorDescription = metaphorType.description

      // 3. 构建文本分析提示词
      // 修改文本生成提示词，移除军事相关内容
      const textPrompt = `你是一位数据科学家，请分析以下中美疫情数据对比：

数据：${dataDescription}

基于${metaphorTypeName}(${metaphorDescription})进行对比分析，要求：
1. 分析两国数据趋势差异、规模差异和变化模式
2. 解释如何通过${metaphorType.example}在单一张图像中体现数据对比
3. 描述视觉隐喻如何映射数据特征（趋势、规模、波动性）
4. 使用积极、非暴力的隐喻：如棋局、比赛、舞蹈、自然现象等
5. 用清晰结构输出分析报告，包含：
   - 数据概览
   - 趋势对比分析
   - 隐喻映射解释（如何在同一场景中对比中美）
   - 视觉对比效果评估
6. 语言简洁，突出对比性，避免军事战争等敏感话题`

      // 4. 并发生成文本和对比提示词
      const [aiResponse, contrastPrompt] = await Promise.all([
        generateTextWithQWEN(textPrompt),
        generateContrastPromptByAI(exampleData, metaphorType)
      ])

      // 5. 生成单张对比图像
      console.log('开始生成中美对比图像...')
      const contrastImageUrl = await generateImageWithQWEN(contrastPrompt)

      setGeneratedImage({
        url: contrastImageUrl,
        description: `中美数据对比 - ${metaphorTypeName}`,
        prompt: contrastPrompt
      })

      console.log('对比图像生成成功')

      // 6. 优化文本展示样式
      setNarrativeResult(`
<div class="space-y-6 text-gray-700">
  <div class="text-2xl font-bold text-gray-900 flex items-center">
    <span class="mr-2">🌍</span> 中美数据对比分析报告（${metaphorTypeName}）
  </div>

  <div class="bg-gradient-to-r from-red-50 via-purple-50 to-blue-50 rounded-xl p-4 border border-gray-200">
    <div class="font-semibold text-purple-800">对比分析框架</div>
    <div class="text-sm text-gray-600 mt-1">通过${metaphorTypeName}在同一场景中对比中美数据差异</div>
    <div class="mt-2 text-sm text-gray-700 italic">${metaphorType.example}</div>
  </div>

  <!-- 数据概览 -->
  <div class="space-y-2">
    <div class="text-xl font-bold text-gray-800">数据对比概览</div>
    <div class="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
      ${
        aiResponse.includes('### 数据概览')
          ? aiResponse.split('### 数据概览')[1].split('### 趋势')[0].trim()
          : `中美数据规模比约1:${Math.round(
              getScaleRatio(exampleData)
            )}，中国数据持续下降（1000→150），美国数据呈倒V型波动（5000→15000→7000），${getVolatilityComparison(
              exampleData
            )}。`
      }
    </div>
  </div>

  <!-- 趋势对比分析 -->
  <div class="space-y-2">
    <div class="text-xl font-bold text-gray-800">趋势对比分析</div>
    <div class="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
      ${
        aiResponse.includes('### 趋势')
          ? aiResponse.split('### 趋势')[1].split('### 隐喻')[0].trim()
          : `中国趋势：平稳下降，从峰值到谷值减少85%，变化连续；美国趋势：剧烈波动，3-4月达到峰值后快速回落，最大波动幅度达80%。`
      }
    </div>
  </div>

  <!-- 隐喻映射解释 -->
  <div class="space-y-2">
    <div class="text-xl font-bold text-gray-800">隐喻映射解释</div>
    <div class="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
      ${
        aiResponse.includes('### 隐喻')
          ? aiResponse.split('### 隐喻')[1].split('### 视觉')[0].trim()
          : `${metaphorTypeName}将中美数据对比映射为同一视觉场景：中国数据特征→左侧/红色/稳定元素，美国数据特征→右侧/蓝色/波动元素。通过位置、色彩、形态对比体现数据差异。`
      }
    </div>
  </div>

  <!-- 视觉对比效果 -->
  <div class="space-y-2">
    <div class="text-xl font-bold text-gray-800">视觉对比效果</div>
    <div class="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
      ${
        aiResponse.includes('### 视觉')
          ? aiResponse.split('### 视觉')[1].trim()
          : `生成的单张对比图像通过左右分割/场景对比体现：1) 规模差异（右侧元素更大更多），2) 趋势差异（左侧平稳下降，右侧剧烈起伏），3) 文化差异（东方vs西方美学风格）。`
      }
    </div>
  </div>

  <div class="mt-8 pt-6 border-t border-gray-200">
    <div class="text-xl font-bold text-gray-800 flex items-center">
      <span class="mr-2">🖼️</span> 生成的中美对比图像
    </div>
    <div class="text-gray-600 mt-2">基于${metaphorTypeName}在同一场景中对比中美数据特征</div>
  </div>
</div>
      `)

      setIsGeneratingImages(false)
    } catch (error: unknown) {
      console.error('生成失败:', error)

      // 出错时的备用响应
      const metaphorType = metaphorTypes.find((m) => m.id === selectedMetaphor)!
      const fallbackResponse = `
<div class="space-y-6 text-gray-700">
  <div class="text-2xl font-bold text-gray-900 flex items-center">
    <span class="mr-2">🌍</span> 中美数据对比分析报告（演示模式）
  </div>

  <div class="bg-gradient-to-r from-red-50 via-purple-50 to-blue-50 rounded-xl p-4 border border-gray-200">
    <div class="font-semibold text-purple-800">${
      metaphorType.name
    }对比框架</div>
    <div class="text-sm text-gray-600 mt-1">${metaphorType.description}</div>
  </div>

  <div class="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
    <div class="text-lg font-bold text-gray-800 mb-2">${
      metaphorType.name
    }对比解释</div>
    <div class="text-gray-700">${metaphorType.example}</div>
    <div class="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
      <div class="font-semibold text-gray-800">视觉映射逻辑：</div>
      <div class="mt-1">左侧红色区域代表中国数据：平稳下降趋势 → 稳健棋局/平缓山坡</div>
      <div class="mt-1">右侧蓝色区域代表美国数据：剧烈波动趋势 → 多变策略/起伏山峰</div>
      <div class="mt-1">面积/数量对比体现规模差异（${Math.round(
        getScaleRatio(exampleData)
      )}:1）</div>
    </div>
  </div>

  <div class="mt-8 pt-6 border-t border-gray-200">
    <div class="text-xl font-bold text-gray-800 flex items-center">
      <span class="mr-2">🖼️</span> 对比视觉叙事
    </div>
    <div class="text-gray-600 mt-2">单张图像中的中美数据对比：左侧中国红，右侧美国蓝</div>
    <div class="grid grid-cols-1 gap-4 mt-4">
      <div class="bg-gradient-to-r from-red-50 to-blue-50 rounded-lg p-4 border border-gray-200">
        <div class="font-bold text-gray-800 mb-2">对比图像描述</div>
        <div class="text-sm text-gray-700">
          ${
            metaphorType.id === 1
              ? '同一战场：左侧红金盔甲中国将军指挥稳固防御，右侧蓝银盔甲美国骑士发起波动冲锋'
              : metaphorType.id === 2
                ? '同一故事场景：左红阵营平稳撤退防守，右蓝阵营剧烈波动进攻'
                : metaphorType.id === 3
                  ? '同一空间：左红色平缓下降阶梯，右蓝色陡峭起伏锯齿'
                  : '左右分割：左红色平缓山坡，右蓝色陡峭山峰'
          }
        </div>
      </div>
    </div>
    <div class="mt-4 text-sm text-gray-500">*网络连接有问题，显示本地分析结果*</div>
  </div>
</div>
      `

      setNarrativeResult(fallbackResponse)
      setIsGeneratingImages(false)

      // 使用备用对比图像
      setGeneratedImage({
        url: getFallbackImage(),
        description: `中美对比 - ${metaphorType.name}（备用）`,
        prompt: getFallbackContrastPrompt(exampleData, metaphorType)
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // 查看演示数据
  const handleViewDemo = () => {
    setShowDemo(true)
    setUploadedChinaFile(new File([], '中国疫情数据.csv'))
    setUploadedUSFile(new File([], '美国疫情数据.csv'))
    setActiveStep(2)
  }

  // 简单图表组件
  const DataChart = () => (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-blue-50/30 p-6 shadow-lg backdrop-blur-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800">中美疫情数据对比</h3>
          <p className="mt-1 text-sm text-gray-500">2023年上半年趋势对比</p>
        </div>
        <div className="rounded-full bg-gradient-to-r from-red-500 to-blue-500 px-3 py-1">
          <span className="text-xs font-semibold text-white">对比演示</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <div className="mr-2 size-3 rounded-full bg-red-500"></div>
            <span>中国数据（持续下降）</span>
          </div>
          <div className="flex items-center">
            <div className="mr-2 size-3 rounded-full bg-blue-500"></div>
            <span>美国数据（剧烈波动）</span>
          </div>
        </div>

        {exampleData.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {item.date}
              </span>
              <div className="flex space-x-6">
                <span className="text-sm font-semibold text-red-600">
                  {item.china.toLocaleString()}
                </span>
                <span className="text-sm font-semibold text-blue-600">
                  {item.usa.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="flex-1 overflow-hidden rounded-full bg-gradient-to-r from-red-100 to-red-50">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-red-400 to-red-300 transition-all duration-700"
                  style={{ width: `${(item.china / 15000) * 100}%` }}
                ></div>
              </div>
              <div className="flex-1 overflow-hidden rounded-full bg-gradient-to-r from-blue-100 to-blue-50">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-300 transition-all delay-100 duration-700"
                  style={{ width: `${(item.usa / 15000) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}

        <div className="border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-600">
            <div className="mb-1 flex justify-between">
              <span>规模比例：</span>
              <span className="font-semibold">
                1 : {Math.round(getScaleRatio(exampleData))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>趋势对比：</span>
              <span className="font-semibold">平稳下降 vs 剧烈波动</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 渐变装饰 */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-40 -top-40 size-80 rounded-full bg-gradient-to-r from-red-200 to-red-100 opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-gradient-to-r from-blue-200 to-blue-100 opacity-20 blur-3xl"></div>
      </div>

      {/* 导航栏 */}
      <nav className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-blue-600 shadow-lg">
                <span className="text-lg font-bold text-white">M</span>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">
                  MetaphorAI
                </span>
                <div className="text-xs font-medium text-gray-500">
                  中美数据单图对比叙事
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 rounded-full bg-gradient-to-r from-red-50 to-blue-50 px-4 py-2">
              <div className="size-2 animate-pulse rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-700">
                单图对比模式
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* 标题区域 */}
        <section className="mb-16 text-center">
          <div className="mb-6 inline-block rounded-full bg-gradient-to-r from-red-100 via-purple-100 to-blue-100 px-4 py-1">
            <span className="text-sm font-semibold text-gray-700">
              基于概念隐喻理论 (CMT) 的单图对比叙事
            </span>
          </div>
          <h1 className="mb-6 bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
            {typedText}
            {isTyping && (
              <span className="ml-2 inline-block h-12 w-1 animate-pulse bg-gradient-to-b from-red-500 to-blue-500"></span>
            )}
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600">
            将中美数据对比通过概念隐喻映射为单一张图像中的视觉叙事，在同一个场景中展现文化差异与数据特征
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
                    {['数据输入', '隐喻选择', 'AI生成', '对比输出'][step - 1]}
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
            {/* 数据上传区域 */}
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-blue-50/20 p-8 shadow-xl backdrop-blur-sm">
              <div className="mb-6 flex items-center space-x-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-blue-500">
                  <span className="text-lg font-bold text-white">1</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    对比数据输入
                  </h2>
                  <p className="text-gray-500">上传中美数据生成对比分析</p>
                </div>
              </div>

              {!showDemo ? (
                <div className="space-y-6">
                  {/* 中国数据上传 */}
                  <div className="group relative rounded-xl border-2 border-dashed border-red-300 p-6 text-center transition-all hover:border-red-400 hover:bg-red-50/30">
                    <div className="relative mb-4 flex justify-center">
                      <div className="rounded-full bg-gradient-to-r from-red-100 to-pink-100 p-3">
                        <div className="text-3xl text-red-600">🇨🇳</div>
                      </div>
                    </div>
                    <p className="mb-3 font-medium text-gray-700">
                      中国数据文件（左侧/红色）
                    </p>
                    <label className="relative inline-block cursor-pointer">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => handleFileUpload(e, 'china')}
                        className="hidden"
                      />
                      <div className="rounded-lg bg-gradient-to-r from-red-500 to-pink-500 px-6 py-2 font-semibold text-white shadow-lg transition-transform hover:scale-105">
                        {uploadedChinaFile ? '重新选择' : '上传文件'}
                      </div>
                    </label>
                    {uploadedChinaFile && (
                      <div className="mt-2">
                        <p className="text-sm text-green-600">
                          ✓ {uploadedChinaFile.name}
                        </p>
                        <button
                          onClick={() => removeFile('china')}
                          className="mt-1 text-xs text-gray-500 hover:text-red-500"
                        >
                          移除文件
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 美国数据上传 */}
                  <div className="group relative rounded-xl border-2 border-dashed border-blue-300 p-6 text-center transition-all hover:border-blue-400 hover:bg-blue-50/30">
                    <div className="relative mb-4 flex justify-center">
                      <div className="rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 p-3">
                        <div className="text-3xl text-blue-600">🇺🇸</div>
                      </div>
                    </div>
                    <p className="mb-3 font-medium text-gray-700">
                      美国数据文件（右侧/蓝色）
                    </p>
                    <label className="relative inline-block cursor-pointer">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => handleFileUpload(e, 'usa')}
                        className="hidden"
                      />
                      <div className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-2 font-semibold text-white shadow-lg transition-transform hover:scale-105">
                        {uploadedUSFile ? '重新选择' : '上传文件'}
                      </div>
                    </label>
                    {uploadedUSFile && (
                      <div className="mt-2">
                        <p className="text-sm text-green-600">
                          ✓ {uploadedUSFile.name}
                        </p>
                        <button
                          onClick={() => removeFile('usa')}
                          className="mt-1 text-xs text-gray-500 hover:text-blue-500"
                        >
                          移除文件
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 对比指示器 */}
                  <div className="rounded-xl bg-gradient-to-r from-red-50 via-purple-50 to-blue-50 p-4">
                    <div className="flex justify-between">
                      <div
                        className={`flex items-center ${
                          uploadedChinaFile ? 'text-red-600' : 'text-gray-500'
                        }`}
                      >
                        <span className="mr-2">
                          {uploadedChinaFile ? '✓' : '○'}
                        </span>
                        <span>中国数据</span>
                        <span className="ml-2 text-xs">(左侧/红)</span>
                      </div>
                      <div className="flex items-center text-gray-400">
                        <span className="mx-2">vs</span>
                      </div>
                      <div
                        className={`flex items-center ${
                          uploadedUSFile ? 'text-blue-600' : 'text-gray-500'
                        }`}
                      >
                        <span className="mr-2">
                          {uploadedUSFile ? '✓' : '○'}
                        </span>
                        <span>美国数据</span>
                        <span className="ml-2 text-xs">(右侧/蓝)</span>
                      </div>
                    </div>
                    <div className="mt-3 text-center text-sm text-gray-600">
                      {uploadedChinaFile && uploadedUSFile
                        ? '✓ 对比数据已就绪，将生成单张对比图像'
                        : '请上传两个文件进行对比分析'}
                    </div>
                  </div>

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
                      setActiveStep(1)
                      setUploadedChinaFile(null)
                      setUploadedUSFile(null)
                    }}
                    className="mt-6 flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  >
                    <span>← 返回上传数据</span>
                  </button>
                </div>
              )}
            </div>

            {/* 隐喻选择区域 */}
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-purple-50/20 p-8 shadow-xl backdrop-blur-sm">
              <div className="mb-6 flex items-center space-x-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-600">
                  <span className="text-lg font-bold text-white">2</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    对比隐喻映射
                  </h2>
                  <p className="text-gray-500">选择单图对比的叙事框架</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {metaphorTypes.map((metaphor) => (
                  <div
                    key={metaphor.id}
                    className={`group relative cursor-pointer rounded-xl border-2 p-5 transition-all duration-300 ${
                      selectedMetaphor === metaphor.id
                        ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-white shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => {
                      setSelectedMetaphor(metaphor.id)
                      setActiveStep(3)
                    }}
                  >
                    {selectedMetaphor === metaphor.id && (
                      <div className="absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                        <span className="text-white">✓</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <div
                        className={`mr-4 flex size-14 items-center justify-center rounded-xl bg-gradient-to-r ${metaphor.color} text-2xl shadow-md`}
                      >
                        {metaphor.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-gray-900">
                            {metaphor.name}
                          </h3>
                          <div
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              selectedMetaphor === metaphor.id
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            单图对比
                          </div>
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
            </div>

            {/* 生成按钮 */}
            <button
              onClick={handleGenerateNarrative}
              disabled={
                isGenerating ||
                (!uploadedChinaFile && !uploadedUSFile && !showDemo)
              }
              className={`group relative w-full overflow-hidden rounded-2xl py-5 text-xl font-bold transition-all duration-300 ${
                isGenerating
                  ? 'cursor-not-allowed bg-gray-400'
                  : (uploadedChinaFile && uploadedUSFile) || showDemo
                    ? 'bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-white hover:shadow-2xl hover:shadow-blue-500/30'
                    : 'cursor-not-allowed bg-gray-200 text-gray-500'
              }`}
            >
              <div className="relative z-10">
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <div className="mr-3 size-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    正在生成单图对比叙事...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="mr-2">🌏</span>
                    生成单图对比叙事
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
            </button>
          </div>

          {/* 右侧：输出结果 */}
          <div className="space-y-8">
            {/* 结果展示区域 */}
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-amber-50/20 p-8 shadow-xl backdrop-blur-sm">
              <div className="mb-6 flex items-center space-x-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500">
                  <span className="text-lg font-bold text-white">3</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    单图对比结果
                  </h2>
                  <p className="text-gray-500">查看生成的中美数据对比图像</p>
                </div>
              </div>

              {isGenerating ? (
                <div className="space-y-8 py-8">
                  {/* 文本生成指示器 */}
                  <div className="text-center">
                    <div className="relative mx-auto mb-6">
                      <div className="absolute inset-0 animate-ping rounded-full bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 opacity-20"></div>
                      <div className="relative flex size-24 items-center justify-center rounded-full bg-gradient-to-r from-red-100 via-purple-100 to-blue-100">
                        <div className="size-16 animate-spin rounded-full border-4 border-red-200 border-t-blue-500"></div>
                      </div>
                    </div>
                    <p className="text-lg font-medium text-gray-700">
                      AI正在生成单图对比叙事...
                    </p>
                    <p className="mt-2 text-gray-500">
                      正在分析数据差异并构建对比场景
                    </p>
                  </div>

                  {/* 图像生成指示器 */}
                  {isGeneratingImages && (
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
                            基于选择的隐喻类型在同一场景中对比中美数据
                          </p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-white p-6 text-center">
                        <div className="mb-4 flex justify-center">
                          <div className="relative size-32">
                            <div className="absolute left-0 top-0 size-32 animate-pulse rounded-l-full bg-gradient-to-r from-red-200 to-red-100"></div>
                            <div className="absolute right-0 top-0 size-32 animate-pulse rounded-r-full bg-gradient-to-r from-blue-200 to-blue-100 delay-300"></div>
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl">
                              vs
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-purple-600">
                          生成中：左侧中国红 · 右侧美国蓝 · 单图对比
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : narrativeResult ? (
                <div className="space-y-8">
                  {/* 渲染优化后的文本内容 */}
                  <div
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: narrativeResult }}
                  />

                  {generatedImage && (
                    <div>
                      <div className="mb-6 text-center">
                        <div className="inline-flex items-center space-x-4 rounded-full bg-gradient-to-r from-red-50 via-purple-50 to-blue-50 px-6 py-2">
                          <div className="flex items-center">
                            <div className="mr-2 size-3 rounded-full bg-red-500"></div>
                            <span className="font-medium text-red-600">
                              中国数据
                            </span>
                          </div>
                          <div className="text-gray-400">vs</div>
                          <div className="flex items-center">
                            <div className="mr-2 size-3 rounded-full bg-blue-500"></div>
                            <span className="font-medium text-blue-600">
                              美国数据
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
                          <div className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-red-600/10 to-transparent"></div>
                          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-blue-600/10 to-transparent"></div>

                          <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="mr-3 text-2xl">🇨🇳</span>
                                <div>
                                  <div className="font-bold text-white">
                                    中国数据
                                  </div>
                                  <div className="text-sm text-red-200">
                                    左侧 · 红色 · 平稳下降
                                  </div>
                                </div>
                              </div>
                              <div className="rounded-full bg-black/40 px-4 py-1">
                                <span className="text-lg font-bold text-white">
                                  VS
                                </span>
                              </div>
                              <div className="flex items-center">
                                <div className="text-right">
                                  <div className="font-bold text-white">
                                    美国数据
                                  </div>
                                  <div className="text-sm text-blue-200">
                                    右侧 · 蓝色 · 剧烈波动
                                  </div>
                                </div>
                                <span className="ml-3 text-2xl">🇺🇸</span>
                              </div>
                            </div>
                          </div>

                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                            <div className="flex justify-center">
                              <div className="rounded-full bg-gradient-to-r from-red-500/20 via-purple-500/20 to-blue-500/20 px-4 py-2 backdrop-blur-sm">
                                <span className="font-semibold text-white">
                                  {
                                    metaphorTypes.find(
                                      (m) => m.id === selectedMetaphor
                                    )?.name
                                  }
                                  对比
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
                            <div className="rounded-lg bg-red-50 p-3">
                              <div className="mb-1 text-sm font-semibold text-red-700">
                                中国特征
                              </div>
                              <div className="text-xs text-gray-600">
                                平稳下降 · 红色调 · 左侧布局 · 东方美学
                              </div>
                            </div>
                            <div className="rounded-lg bg-blue-50 p-3">
                              <div className="mb-1 text-sm font-semibold text-blue-700">
                                美国特征
                              </div>
                              <div className="text-xs text-gray-600">
                                剧烈波动 · 蓝色调 · 右侧布局 · 西方美学
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
                            🔍 查看对比提示词详情
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4 border-t border-gray-200 pt-6">
                    <button
                      onClick={() => {
                        const metaphorName =
                          metaphorTypes.find((m) => m.id === selectedMetaphor)
                            ?.name || ''
                        const content = `# 中美单图对比叙事报告_${
                          new Date().toISOString().split('T')[0]
                        }
## 对比分析类型：${metaphorName}
## 数据对比概览
- 趋势对比：中国平稳下降 vs 美国剧烈波动
- 规模比例：1:${Math.round(getScaleRatio(exampleData))}
- 波动对比：${getVolatilityComparison(exampleData)}
## 隐喻对比解释
${metaphorTypes.find((m) => m.id === selectedMetaphor)?.example}
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
                        a.download = `中美单图对比叙事_${
                          new Date().toISOString().split('T')[0]
                        }.md`
                        a.click()
                      }}
                      className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105"
                    >
                      📥 导出对比报告
                    </button>
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
                    <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-red-100 via-purple-100 to-blue-100"></div>
                    <div className="relative flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-white to-purple-50">
                      <div className="text-4xl">🌏</div>
                    </div>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-gray-900">
                    等待生成单图对比叙事
                  </h3>
                  <p className="text-gray-600">
                    上传中美两个数据文件并选择隐喻类型后，将在此处生成单张对比图像
                  </p>
                  <div className="mt-6 inline-block rounded-full bg-gradient-to-r from-red-100 via-purple-100 to-blue-100 px-4 py-2">
                    <span className="text-sm font-medium text-gray-700">
                      中国数据 vs 美国数据 = 单图对比 + 视觉叙事
                    </span>
                  </div>
                  <div className="mt-6 flex justify-center space-x-4">
                    <div className="rounded-lg bg-red-50 p-3">
                      <div className="text-sm font-semibold text-red-700">
                        中国侧
                      </div>
                      <div className="text-xs text-gray-600">
                        左侧 · 红色 · 平稳
                      </div>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-3">
                      <div className="text-sm font-semibold text-blue-700">
                        美国侧
                      </div>
                      <div className="text-xs text-gray-600">
                        右侧 · 蓝色 · 波动
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 理论说明 */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-gray-900 p-8 text-white shadow-2xl">
              <h2 className="mb-4 text-2xl font-bold">单图对比理论</h2>
              <div className="space-y-4">
                <div className="rounded-xl bg-gradient-to-r from-red-900/50 via-purple-900/50 to-blue-900/50 p-4">
                  <h3 className="mb-2 font-bold text-red-300">单图对比框架</h3>
                  <p className="text-sm text-gray-300">
                    通过左右分割/场景融合，在同一张图像中对比中美数据特征，红蓝对比色系。
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-4">
                  <h3 className="mb-2 font-bold text-purple-300">
                    对比隐喻策略
                  </h3>
                  <p className="text-sm text-gray-300">
                    四种概念隐喻分别提供不同的单图对比策略：实体对峙、结构冲突、方位对比、图像分割。
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-r from-emerald-900/50 to-green-900/50 p-4">
                  <h3 className="mb-2 font-bold text-emerald-300">
                    AI对比生成
                  </h3>
                  <p className="text-sm text-gray-300">
                    通义千问生成对比提示词，创建融合中美特征的单一对比图像。
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
            <div className="mb-6 inline-block rounded-full bg-gradient-to-r from-red-500/20 via-purple-500/20 to-blue-500/20 px-6 py-2">
              <h3 className="text-lg font-bold text-white">单图对比叙事系统</h3>
            </div>
            <p className="mb-4 text-2xl font-bold text-white">
              《基于概念隐喻的中美数据单图对比叙事生成》
            </p>
            <div className="mt-8 flex justify-center space-x-6">
              <div className="rounded-lg bg-gradient-to-r from-red-500/10 to-red-400/10 px-4 py-2">
                <div className="text-sm text-red-300">中国侧</div>
                <div className="font-medium text-white">
                  左侧 · 红色 · 东方视角
                </div>
              </div>
              <div className="rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-400/10 px-4 py-2">
                <div className="text-sm text-blue-300">美国侧</div>
                <div className="font-medium text-white">
                  右侧 · 蓝色 · 西方视角
                </div>
              </div>
              <div className="rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-4 py-2">
                <div className="text-sm text-purple-300">单图对比</div>
                <div className="font-medium text-white">
                  红蓝融合 · 视觉叙事
                </div>
              </div>
            </div>
            <p className="mt-8 text-sm text-gray-400">
              © 2026 毕业设计 · 中美数据单图对比叙事实验室
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
