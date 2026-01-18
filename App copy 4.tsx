import { useState, useEffect } from 'react'

// 概念隐喻类型
const metaphorTypes = [
  {
    id: 1,
    name: '实体隐喻',
    description: '将两组数据拟人化为两个角色在同一场景中互动',
    icon: '👤',
    example: '数据A→沉稳角色，数据B→活跃角色，在同一场景互动',
    color: 'from-blue-400 to-cyan-400',
    bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50'
  },
  {
    id: 2,
    name: '结构隐喻',
    description: '将两组趋势差异映射为同一故事中的情节差异',
    icon: '📈',
    example: '数据A平稳趋势→稳定结构，数据B变化趋势→动态结构',
    color: 'from-emerald-400 to-green-400',
    bgColor: 'bg-gradient-to-br from-emerald-50 to-green-50'
  },
  {
    id: 3,
    name: '方位隐喻',
    description: '在同一空间布局中用位置/色彩差异体现数据对比',
    icon: '🧭',
    example: '左侧数据A，右侧数据B，通过空间关系展现差异',
    color: 'from-violet-400 to-purple-400',
    bgColor: 'bg-gradient-to-br from-violet-50 to-purple-50'
  },
  {
    id: 4,
    name: '图像隐喻',
    description: '用同一图像的左右分割对比两组数据形态差异',
    icon: '🎨',
    example: '左半部平缓形态，右半部起伏形态，展现数据特征',
    color: 'from-pink-400 to-rose-400',
    bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50'
  }
]

// 定义数据项接口
interface DataItem {
  date: string
  groupA: number
  groupB: number
}

// 示例数据 - 更一般化的数据
const exampleData: DataItem[] = [
  { date: '2023-01', groupA: 1200, groupB: 1800 },
  { date: '2023-02', groupA: 1500, groupB: 1600 },
  { date: '2023-03', groupA: 1300, groupB: 2200 },
  { date: '2023-04', groupA: 1700, groupB: 1900 },
  { date: '2023-05', groupA: 1400, groupB: 2100 },
  { date: '2023-06', groupA: 1600, groupB: 1700 }
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
  const [uploadedFileA, setUploadedFileA] = useState<File | null>(null)
  const [uploadedFileB, setUploadedFileB] = useState<File | null>(null)
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

  // 处理文件上传
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'groupA' | 'groupB'
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

      if (type === 'groupA') {
        setUploadedFileA(file)
      } else {
        setUploadedFileB(file)
      }

      if (
        (type === 'groupA' && uploadedFileB) ||
        (type === 'groupB' && uploadedFileA)
      ) {
        setActiveStep(2)
      }
    }
  }

  // 移除文件
  const removeFile = (type: 'groupA' | 'groupB') => {
    if (type === 'groupA') {
      setUploadedFileA(null)
    } else {
      setUploadedFileB(null)
    }
    setActiveStep(1)
  }

  // 数据特征分析函数 - 更通用的分析
  function getTrendDescription(data: DataItem[]): string {
    const groupAValues = data.map((d) => d.groupA)
    const groupBValues = data.map((d) => d.groupB)

    const groupAFirst = groupAValues[0]
    const groupALast = groupAValues[groupAValues.length - 1]
    const groupBFirst = groupBValues[0]
    const groupBLast = groupBValues[groupBValues.length - 1]

    const groupATrend =
      groupALast > groupAFirst
        ? '上升'
        : groupALast < groupAFirst
          ? '下降'
          : '持平'
    const groupBTrend =
      groupBLast > groupBFirst
        ? '上升'
        : groupBLast < groupBFirst
          ? '下降'
          : '持平'

    return `数据A：整体${groupATrend}趋势；数据B：整体${groupBTrend}趋势`
  }

  function getDataCharacteristics(data: DataItem[]): {
    groupAMean: number
    groupBMean: number
    groupAStdDev: number
    groupBStdDev: number
    groupAMax: number
    groupBMax: number
    groupAMin: number
    groupBMin: number
  } {
    const groupAValues = data.map((d) => d.groupA)
    const groupBValues = data.map((d) => d.groupB)

    const groupAMean =
      groupAValues.reduce((a, b) => a + b, 0) / groupAValues.length
    const groupBMean =
      groupBValues.reduce((a, b) => a + b, 0) / groupBValues.length

    const groupAVariance =
      groupAValues.reduce(
        (acc, val) => acc + Math.pow(val - groupAMean, 2),
        0
      ) / groupAValues.length
    const groupBVariance =
      groupBValues.reduce(
        (acc, val) => acc + Math.pow(val - groupBMean, 2),
        0
      ) / groupBValues.length

    return {
      groupAMean,
      groupBMean,
      groupAStdDev: Math.sqrt(groupAVariance),
      groupBStdDev: Math.sqrt(groupBVariance),
      groupAMax: Math.max(...groupAValues),
      groupBMax: Math.max(...groupBValues),
      groupAMin: Math.min(...groupAValues),
      groupBMin: Math.min(...groupBValues)
    }
  }

  function getComparisonDescription(data: DataItem[]): string {
    const chars = getDataCharacteristics(data)
    const ratio = chars.groupBMean / chars.groupAMean

    let sizeDesc = ''
    if (ratio > 1.5) sizeDesc = '数据B规模显著大于数据A'
    else if (ratio > 1.1) sizeDesc = '数据B规模略大于数据A'
    else if (ratio > 0.9) sizeDesc = '两组数据规模相近'
    else if (ratio > 0.6) sizeDesc = '数据A规模略大于数据B'
    else sizeDesc = '数据A规模显著大于数据B'

    const volatilityRatio = chars.groupBStdDev / chars.groupAStdDev
    let volatilityDesc = ''
    if (volatilityRatio > 1.5) volatilityDesc = '数据B波动性更高'
    else if (volatilityRatio > 1.1) volatilityDesc = '数据B波动性稍高'
    else if (volatilityRatio > 0.9) volatilityDesc = '波动性相近'
    else if (volatilityRatio > 0.6) volatilityDesc = '数据A波动性稍高'
    else volatilityDesc = '数据A波动性更高'

    return `${sizeDesc}；${volatilityDesc}`
  }

  // 备用图片
  const getFallbackImage = (): string => {
    return 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=1024&h=768&fit=crop&auto=format'
  }

  // 备用对比提示词 - 更通用
  const getFallbackContrastPrompt = (
    data: DataItem[],
    metaphorType: (typeof metaphorTypes)[0]
  ): string => {
    const chars = getDataCharacteristics(data)
    const comparison = getComparisonDescription(data)

    let prompt = ''
    switch (metaphorType.id) {
      case 1: // 实体隐喻
        prompt = `在同一场景中，左侧代表数据A的角色沉稳安定，右侧代表数据B的角色活跃多变。通过角色姿态和互动展现数据特征差异。${comparison}。暖色调与冷色调对比，简约现代艺术风格。`
        break
      case 2: // 结构隐喻
        prompt = `同一结构中，左侧元素代表数据A，呈现稳定有序的排列；右侧元素代表数据B，呈现动态变化的布局。${comparison}。几何结构抽象艺术，左右对比构图。`
        break
      case 3: // 方位隐喻
        prompt = `空间布局对比：画面左侧区域代表数据A，色调温暖，形态稳定；画面右侧区域代表数据B，色调冷峻，形态变化。${comparison}。现代抽象艺术风格，空间层次分明。`
        break
      case 4: // 图像隐喻
        prompt = `左右分割图像：左半部代表数据A，色调温暖渐变，形态平稳延续；右半部代表数据B，色调冷色渐变，形态起伏变化。${comparison}。数字艺术风格，柔和过渡。`
        break
      default:
        prompt = `两组数据对比场景：左侧代表数据A，右侧代表数据B，通过色彩和形态差异展现数据特征。${comparison}。抽象表现主义风格。`
    }
    return prompt
  }

  // AI生成对比提示词
  const generateContrastPromptByAI = async (
    data: DataItem[],
    metaphorType: (typeof metaphorTypes)[0]
  ): Promise<string> => {
    const trend = getTrendDescription(data)
    const comparison = getComparisonDescription(data)
    const chars = getDataCharacteristics(data)

    const prompt = `你是专业视觉隐喻设计师，基于概念隐喻理论生成数据对比图像提示词。

隐喻类型：${metaphorType.name}
原理：${metaphorType.description}

数据特征：
- 趋势特征：${trend}
- 对比关系：${comparison}
- 数据A范围：${chars.groupAMin.toFixed(0)}~${chars.groupAMax.toFixed(0)}
- 数据B范围：${chars.groupBMin.toFixed(0)}~${chars.groupBMax.toFixed(0)}
- 平均值比：数据B是数据A的${(chars.groupBMean / chars.groupAMean).toFixed(2)}倍

要求：
1. 必须生成单一张图像，体现两组数据对比
2. 严格使用${metaphorType.name}：${metaphorType.example}
3. 通过左右分割或同一场景中的两个元素对比展现差异
4. 左侧用暖色调（偏黄/橙），右侧用冷色调（偏蓝/青）
5. 根据数据特征选择视觉元素：稳定vs变化、有序vs动态、平缓vs起伏
6. 规模差异通过元素大小/数量/密度体现
7. 使用积极、健康的隐喻：如自然场景、建筑结构、艺术装置等
8. 避免任何敏感或争议性内容
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
        '死亡',
        '血腥',
        '暴力'
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
    if ((!uploadedFileA || !uploadedFileB) && !showDemo) {
      alert('请先上传两个对比数据文件')
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
        ? `两组数据对比示例，包含6个月的数据点，展示一般化的数据对比特征`
        : `数据A文件：${uploadedFileA?.name}，数据B文件：${uploadedFileB?.name}`

      // 2. 获取隐喻类型信息
      const metaphorType = metaphorTypes.find((m) => m.id === selectedMetaphor)!
      const metaphorTypeName = metaphorType.name
      const metaphorDescription = metaphorType.description

      // 3. 构建文本分析提示词
      const textPrompt = `你是一位数据科学家，请分析以下两组数据对比：

基于${metaphorTypeName}(${metaphorDescription})进行对比分析，要求：
1. 分析两组数据的整体趋势、规模和变化特征
2. 解释如何通过${metaphorType.example}在单一张图像中体现数据对比
3. 描述视觉隐喻如何映射数据特征
4. 用清晰结构输出分析报告，包含：
   - 数据概览
   - 趋势对比分析
   - 隐喻映射解释
   - 视觉对比效果评估
5. 语言简洁，突出对比性，避免专业术语`

      // 4. 并发生成文本和对比提示词
      const [aiResponse, contrastPrompt] = await Promise.all([
        generateTextWithQWEN(textPrompt),
        generateContrastPromptByAI(exampleData, metaphorType)
      ])

      // 5. 生成单张对比图像
      console.log('开始生成对比图像...')
      const contrastImageUrl = await generateImageWithQWEN(contrastPrompt)

      setGeneratedImage({
        url: contrastImageUrl,
        description: `数据对比 - ${metaphorTypeName}`,
        prompt: contrastPrompt
      })

      console.log('对比图像生成成功')

      // 6. 优化文本展示样式
      const chars = getDataCharacteristics(exampleData)
      const comparison = getComparisonDescription(exampleData)

      setNarrativeResult(`
<div class="space-y-6 text-gray-700">
  <div class="text-2xl font-bold text-gray-900 flex items-center">
    <span class="mr-2">📊</span> 数据对比分析报告（${metaphorTypeName}）
  </div>

  <div class="bg-gradient-to-r from-amber-50 via-purple-50 to-sky-50 rounded-xl p-4 border border-gray-200">
    <div class="font-semibold text-purple-800">对比分析框架</div>
    <div class="text-sm text-gray-600 mt-1">通过${metaphorTypeName}在同一场景中对比两组数据差异</div>
    <div class="mt-2 text-sm text-gray-700 italic">${metaphorType.example}</div>
  </div>

  <!-- 数据概览 -->
  <div class="space-y-2">
    <div class="text-xl font-bold text-gray-800">数据对比概览</div>
    <div class="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
      ${
        aiResponse.includes('### 数据概览')
          ? aiResponse.split('### 数据概览')[1].split('### 趋势')[0].trim()
          : `数据范围：数据A ${chars.groupAMin.toFixed(
              0
            )}~${chars.groupAMax.toFixed(0)}，数据B ${chars.groupBMin.toFixed(
              0
            )}~${chars.groupBMax.toFixed(0)}。<br>对比特征：${comparison}`
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
          : `${getTrendDescription(
              exampleData
            )}。平均值：数据A ${chars.groupAMean.toFixed(
              0
            )}，数据B ${chars.groupBMean.toFixed(0)}。`
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
          : `${metaphorTypeName}将两组数据对比映射为同一视觉场景：左侧暖色调元素代表数据A特征，右侧冷色调元素代表数据B特征。通过形态、大小、密度等视觉元素体现数据差异。`
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
          : `生成的单张对比图像通过左右分割/场景融合体现数据对比：左侧元素呈现数据A特征，右侧元素呈现数据B特征，通过色彩和形态差异展现对比关系。`
      }
    </div>
  </div>

  <div class="mt-8 pt-6 border-t border-gray-200">
    <div class="text-xl font-bold text-gray-800 flex items-center">
      <span class="mr-2">🖼️</span> 生成的数据对比图像
    </div>
    <div class="text-gray-600 mt-2">基于${metaphorTypeName}在同一场景中对比两组数据特征</div>
  </div>
</div>
      `)

      setIsGeneratingImages(false)
    } catch (error: unknown) {
      console.error('生成失败:', error)

      // 出错时的备用响应
      const metaphorType = metaphorTypes.find((m) => m.id === selectedMetaphor)!
      const chars = getDataCharacteristics(exampleData)
      const comparison = getComparisonDescription(exampleData)

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

  <div class="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
    <div class="text-lg font-bold text-gray-800 mb-3">数据特征对比</div>
    <div class="space-y-2">
      <div class="flex justify-between">
        <span class="text-gray-700">数据范围：</span>
        <span class="font-medium">数据A ${chars.groupAMin.toFixed(
          0
        )}~${chars.groupAMax.toFixed(0)}，数据B ${chars.groupBMin.toFixed(
          0
        )}~${chars.groupBMax.toFixed(0)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-700">平均值：</span>
        <span class="font-medium">数据A ${chars.groupAMean.toFixed(
          0
        )}，数据B ${chars.groupBMean.toFixed(0)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-700">对比关系：</span>
        <span class="font-medium">${comparison}</span>
      </div>
    </div>
  </div>

  <div class="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
    <div class="text-lg font-bold text-gray-800 mb-2">${
      metaphorType.name
    }解释</div>
    <div class="text-gray-700">${metaphorType.example}</div>
    <div class="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
      <div class="font-semibold text-gray-800">视觉映射：</div>
      <div class="mt-1"><span class="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 mr-2"></span>左侧暖色元素 → 数据A特征</div>
      <div class="mt-1"><span class="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 mr-2"></span>右侧冷色元素 → 数据B特征</div>
    </div>
  </div>

  <div class="mt-8 pt-6 border-t border-gray-200">
    <div class="text-xl font-bold text-gray-800 flex items-center">
      <span class="mr-2">🖼️</span> 对比视觉叙事
    </div>
    <div class="text-gray-600 mt-2">单张图像中的两组数据对比：左侧数据A，右侧数据B</div>
    <div class="grid grid-cols-1 gap-4 mt-4">
      <div class="bg-gradient-to-r from-amber-50 to-sky-50 rounded-lg p-4 border border-gray-200">
        <div class="font-bold text-gray-800 mb-2">对比图像描述</div>
        <div class="text-sm text-gray-700">
          ${
            metaphorType.id === 1
              ? '同一场景中两个角色互动：左侧角色沉稳安定，右侧角色活跃多变'
              : metaphorType.id === 2
                ? '结构对比：左侧稳定有序排列，右侧动态变化布局'
                : metaphorType.id === 3
                  ? '空间布局：左侧暖色稳定区域，右侧冷色变化区域'
                  : '图像分割：左侧暖色平缓形态，右侧冷色起伏形态'
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
        description: `数据对比 - ${metaphorType.name}（备用）`,
        prompt: getFallbackContrastPrompt(exampleData, metaphorType)
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // 查看演示数据
  const handleViewDemo = () => {
    setShowDemo(true)
    setUploadedFileA(new File([], '数据A.csv'))
    setUploadedFileB(new File([], '数据B.csv'))
    setActiveStep(2)
  }

  // 简单图表组件
  const DataChart = () => {
    const chars = getDataCharacteristics(exampleData)
    const maxValue = Math.max(chars.groupAMax, chars.groupBMax)

    return (
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-blue-50/30 p-6 shadow-lg backdrop-blur-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              两组数据对比演示
            </h3>
            <p className="mt-1 text-sm text-gray-500">6个月趋势对比示例</p>
          </div>
          <div className="rounded-full bg-gradient-to-r from-amber-500 to-sky-500 px-3 py-1">
            <span className="text-xs font-semibold text-white">演示数据</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <div className="mr-2 size-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"></div>
              <span>数据A</span>
            </div>
            <div className="flex items-center">
              <div className="mr-2 size-3 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400"></div>
              <span>数据B</span>
            </div>
          </div>

          {exampleData.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {item.date}
                </span>
                <div className="flex space-x-6">
                  <span className="text-sm font-semibold text-amber-600">
                    {item.groupA.toLocaleString()}
                  </span>
                  <span className="text-sm font-semibold text-sky-600">
                    {item.groupB.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <div className="flex-1 overflow-hidden rounded-full bg-gradient-to-r from-amber-100 to-amber-50">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-700"
                    style={{ width: `${(item.groupA / maxValue) * 100}%` }}
                  ></div>
                </div>
                <div className="flex-1 overflow-hidden rounded-full bg-gradient-to-r from-sky-100 to-sky-50">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-all delay-100 duration-700"
                    style={{ width: `${(item.groupB / maxValue) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}

          <div className="border-t border-gray-200 pt-4">
            <div className="text-sm text-gray-600">
              <div className="mb-1 flex justify-between">
                <span>平均值：</span>
                <span className="font-semibold">
                  数据A {chars.groupAMean.toFixed(0)}，数据B{' '}
                  {chars.groupBMean.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>数据范围：</span>
                <span className="font-semibold">
                  A: {chars.groupAMin.toFixed(0)}~{chars.groupAMax.toFixed(0)}
                  ，B: {chars.groupBMin.toFixed(0)}~{chars.groupBMax.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
                  数据对比叙事生成系统
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 rounded-full bg-gradient-to-r from-amber-50 to-sky-50 px-4 py-2">
              <div className="size-2 animate-pulse rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-700">
                毕业设计项目
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
              基于概念隐喻理论 (CMT)
            </span>
          </div>
          <h1 className="mb-6 bg-gradient-to-r from-amber-600 via-purple-600 to-sky-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
            {typedText}
            {isTyping && (
              <span className="ml-2 inline-block h-12 w-1 animate-pulse bg-gradient-to-b from-amber-500 to-sky-500"></span>
            )}
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600">
            将任意两组数据通过四种概念隐喻映射为单一张图像中的视觉对比叙事，展现数据的独特特征与对比关系
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
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-sky-500">
                  <span className="text-lg font-bold text-white">1</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    对比数据输入
                  </h2>
                  <p className="text-gray-500">上传两组数据进行对比分析</p>
                </div>
              </div>

              {!showDemo ? (
                <div className="space-y-6">
                  {/* 数据A上传 */}
                  <div className="group relative rounded-xl border-2 border-dashed border-amber-300 p-6 text-center transition-all hover:border-amber-400 hover:bg-amber-50/30">
                    <div className="relative mb-4 flex justify-center">
                      <div className="rounded-full bg-gradient-to-r from-amber-100 to-orange-100 p-3">
                        <div className="text-3xl text-amber-600">📊</div>
                      </div>
                    </div>
                    <p className="mb-3 font-medium text-gray-700">
                      数据A文件
                      <span className="ml-2 inline-flex items-center">
                        <span className="mr-1 size-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"></span>
                        左侧
                      </span>
                    </p>
                    <label className="relative inline-block cursor-pointer">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => handleFileUpload(e, 'groupA')}
                        className="hidden"
                      />
                      <div className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2 font-semibold text-white shadow-lg transition-transform hover:scale-105">
                        {uploadedFileA ? '重新选择' : '上传文件'}
                      </div>
                    </label>
                    {uploadedFileA && (
                      <div className="mt-2">
                        <p className="text-sm text-green-600">
                          ✓ {uploadedFileA.name}
                        </p>
                        <button
                          onClick={() => removeFile('groupA')}
                          className="mt-1 text-xs text-gray-500 hover:text-amber-500"
                        >
                          移除文件
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 数据B上传 */}
                  <div className="group relative rounded-xl border-2 border-dashed border-sky-300 p-6 text-center transition-all hover:border-sky-400 hover:bg-sky-50/30">
                    <div className="relative mb-4 flex justify-center">
                      <div className="rounded-full bg-gradient-to-r from-sky-100 to-cyan-100 p-3">
                        <div className="text-3xl text-sky-600">📈</div>
                      </div>
                    </div>
                    <p className="mb-3 font-medium text-gray-700">
                      数据B文件
                      <span className="ml-2 inline-flex items-center">
                        <span className="mr-1 size-2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400"></span>
                        右侧
                      </span>
                    </p>
                    <label className="relative inline-block cursor-pointer">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => handleFileUpload(e, 'groupB')}
                        className="hidden"
                      />
                      <div className="rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 px-6 py-2 font-semibold text-white shadow-lg transition-transform hover:scale-105">
                        {uploadedFileB ? '重新选择' : '上传文件'}
                      </div>
                    </label>
                    {uploadedFileB && (
                      <div className="mt-2">
                        <p className="text-sm text-green-600">
                          ✓ {uploadedFileB.name}
                        </p>
                        <button
                          onClick={() => removeFile('groupB')}
                          className="mt-1 text-xs text-gray-500 hover:text-sky-500"
                        >
                          移除文件
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 对比指示器 */}
                  <div className="rounded-xl bg-gradient-to-r from-amber-50 via-purple-50 to-sky-50 p-4">
                    <div className="flex justify-between">
                      <div
                        className={`flex items-center ${
                          uploadedFileA ? 'text-amber-600' : 'text-gray-500'
                        }`}
                      >
                        <span className="mr-2">
                          {uploadedFileA ? '✓' : '○'}
                        </span>
                        <span>数据A</span>
                        <div className="ml-2 flex items-center text-xs">
                          <span className="mr-1 size-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"></span>
                          左
                        </div>
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
                        <span>数据B</span>
                        <div className="ml-2 flex items-center text-xs">
                          <span className="mr-1 size-2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400"></span>
                          右
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-center text-sm text-gray-600">
                      {uploadedFileA && uploadedFileB
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
                      setUploadedFileA(null)
                      setUploadedFileB(null)
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
                            点击选择
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
                isGenerating || (!uploadedFileA && !uploadedFileB && !showDemo)
              }
              className={`group relative w-full overflow-hidden rounded-2xl py-5 text-xl font-bold transition-all duration-300 ${
                isGenerating
                  ? 'cursor-not-allowed bg-gray-400'
                  : (uploadedFileA && uploadedFileB) || showDemo
                    ? 'bg-gradient-to-r from-amber-500 via-purple-500 to-sky-500 text-white hover:shadow-2xl hover:shadow-blue-500/30'
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
                    <span className="mr-2">🎨</span>
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
                  <p className="text-gray-500">查看生成的数据对比图像</p>
                </div>
              </div>

              {isGenerating ? (
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
                      正在分析数据特征并构建对比场景
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
                            基于选择的隐喻类型在同一场景中对比两组数据
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
                          生成中：左侧数据A · 右侧数据B · 单图对比
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
                        <div className="inline-flex items-center space-x-4 rounded-full bg-gradient-to-r from-amber-50 via-purple-50 to-sky-50 px-6 py-2">
                          <div className="flex items-center">
                            <div className="mr-2 size-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"></div>
                            <span className="font-medium text-amber-600">
                              数据A
                            </span>
                          </div>
                          <div className="text-gray-400">🆚</div>
                          <div className="flex items-center">
                            <div className="mr-2 size-3 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400"></div>
                            <span className="font-medium text-sky-600">
                              数据B
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="hover:shadow-3xl group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-2xl transition-all">
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
                                    数据A
                                  </div>
                                  <div className="text-sm text-amber-200">
                                    左侧 · 对比特征
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
                                    数据B
                                  </div>
                                  <div className="text-sm text-sky-200">
                                    右侧 · 对比特征
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
                            <div className="rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 p-3">
                              <div className="mb-1 flex items-center">
                                <div className="mr-2 size-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"></div>
                                <div className="text-sm font-semibold text-amber-700">
                                  数据A特征
                                </div>
                              </div>
                              <div className="text-xs text-gray-600">
                                左侧布局 · 稳定元素
                              </div>
                            </div>
                            <div className="rounded-lg bg-gradient-to-br from-sky-50 to-cyan-50 p-3">
                              <div className="mb-1 flex items-center">
                                <div className="mr-2 size-3 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400"></div>
                                <div className="text-sm font-semibold text-sky-700">
                                  数据B特征
                                </div>
                              </div>
                              <div className="text-xs text-gray-600">
                                右侧布局 · 变化元素
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

                  <div className="flex space-x-4 border-t border-gray-200 pt-6">
                    <button
                      onClick={() => {
                        const metaphorName =
                          metaphorTypes.find((m) => m.id === selectedMetaphor)
                            ?.name || ''
                        const chars = getDataCharacteristics(exampleData)
                        const comparison = getComparisonDescription(exampleData)

                        const content = `# 数据对比叙事报告_${
                          new Date().toISOString().split('T')[0]
                        }
## 分析类型：${metaphorName}
## 数据对比概览
- 数据范围：数据A ${chars.groupAMin.toFixed(0)}~${chars.groupAMax.toFixed(
                          0
                        )}，数据B ${chars.groupBMin.toFixed(
                          0
                        )}~${chars.groupBMax.toFixed(0)}
- 平均值：数据A ${chars.groupAMean.toFixed(
                          0
                        )}，数据B ${chars.groupBMean.toFixed(0)}
- 对比关系：${comparison}
## 隐喻解释
${metaphorTypes.find((m) => m.id === selectedMetaphor)?.example}
## 生成图像
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
                    <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-amber-100 via-purple-100 to-sky-100"></div>
                    <div className="relative flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-white to-purple-50">
                      <div className="text-4xl">🎨</div>
                    </div>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-gray-900">
                    等待生成单图对比叙事
                  </h3>
                  <p className="text-gray-600">
                    上传两个对比数据文件并选择隐喻类型后，将在此处生成单张对比图像
                  </p>
                  <div className="mt-6 inline-block rounded-full bg-gradient-to-r from-amber-100 via-purple-100 to-sky-100 px-4 py-2">
                    <span className="text-sm font-medium text-gray-700">
                      数据A对比数据B = 单图视觉叙事
                    </span>
                  </div>
                  <div className="mt-6 flex justify-center space-x-4">
                    <div className="rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 p-3">
                      <div className="flex items-center">
                        <div className="mr-2 size-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"></div>
                        <div className="text-sm font-semibold text-amber-700">
                          数据A
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-gray-600">左侧</div>
                    </div>
                    <div className="rounded-lg bg-gradient-to-br from-sky-50 to-cyan-50 p-3">
                      <div className="flex items-center">
                        <div className="mr-2 size-3 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400"></div>
                        <div className="text-sm font-semibold text-sky-700">
                          数据B
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-gray-600">右侧</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 理论说明 */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-gray-900 p-8 text-white shadow-2xl">
              <h2 className="mb-4 text-2xl font-bold">对比叙事理论</h2>
              <div className="space-y-4">
                <div className="rounded-xl bg-gradient-to-r from-amber-900/50 via-purple-900/50 to-sky-900/50 p-4">
                  <h3 className="mb-2 font-bold text-amber-300">
                    单图对比框架
                  </h3>
                  <p className="text-sm text-gray-300">
                    通过左右分割或场景融合，在同一张图像中对比两组数据特征，暖色冷色对比体现差异。
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-4">
                  <h3 className="mb-2 font-bold text-purple-300">
                    概念隐喻策略
                  </h3>
                  <p className="text-sm text-gray-300">
                    四种概念隐喻分别提供不同的对比策略，适应各种数据特征和对比关系。
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-r from-emerald-900/50 to-green-900/50 p-4">
                  <h3 className="mb-2 font-bold text-emerald-300">
                    AI视觉生成
                  </h3>
                  <p className="text-sm text-gray-300">
                    通过AI分析数据特征并生成视觉提示词，创建融合对比元素的单一图像。
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
              <h3 className="text-lg font-bold text-white">概念隐喻对比系统</h3>
            </div>
            <p className="mb-4 text-2xl font-bold text-white">
              《基于概念隐喻的数据对比叙事生成系统》
            </p>
            <div className="mt-8 flex justify-center space-x-6">
              <div className="rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 py-2">
                <div className="text-sm text-amber-300">数据A</div>
                <div className="font-medium text-white">左侧 · 对比特征</div>
              </div>
              <div className="rounded-lg bg-gradient-to-r from-sky-500/10 to-cyan-500/10 px-4 py-2">
                <div className="text-sm text-sky-300">数据B</div>
                <div className="font-medium text-white">右侧 · 对比特征</div>
              </div>
              <div className="rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-4 py-2">
                <div className="text-sm text-purple-300">单图融合</div>
                <div className="font-medium text-white">
                  视觉对比 · 叙事表达
                </div>
              </div>
            </div>
            <p className="mt-8 text-sm text-gray-400">
              © 2026 毕业设计 · 概念隐喻数据对比叙事实验室
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
