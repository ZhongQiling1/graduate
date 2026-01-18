import { useState, useEffect } from 'react'

// 概念隐喻类型
const metaphorTypes = [
  {
    id: 1,
    name: '实体隐喻',
    description: '抽象概念拟人化，将数据实体投射为具体对象/角色',
    icon: '👤',
    example: '病毒数据 → 入侵军团',
    color: 'from-blue-400 to-cyan-400',
    bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50'
  },
  {
    id: 2,
    name: '结构隐喻',
    description: '用熟悉概念网络映射数据逻辑，将趋势转化为情节结构',
    icon: '📈',
    example: '波峰 → 激烈冲突',
    color: 'from-emerald-400 to-green-400',
    bgColor: 'bg-gradient-to-br from-emerald-50 to-green-50'
  },
  {
    id: 3,
    name: '方位隐喻',
    description: '通过空间位置/色调表达数据属性，映射情绪或趋势',
    icon: '🧭',
    example: '负面数据 → 冷色调',
    color: 'from-violet-400 to-purple-400',
    bgColor: 'bg-gradient-to-br from-violet-50 to-purple-50'
  },
  {
    id: 4,
    name: '图像隐喻',
    description: '通过图形相似性映射数据特征，直观呈现数据形态',
    icon: '🎨',
    example: '曲线 → 山峰/波浪',
    color: 'from-pink-400 to-rose-400',
    bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50'
  }
]

// 定义数据项接口（替代any）
interface DataItem {
  date: string
  china: number
  usa: number
}

// 示例数据（使用明确类型）
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
  country: 'china' | 'usa'
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

// interface PromptGenerationResponse {
//   content: string
// }

function App() {
  const [typedText, setTypedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [uploadedChinaFile, setUploadedChinaFile] = useState<File | null>(null)
  const [uploadedUSFile, setUploadedUSFile] = useState<File | null>(null)
  const [selectedMetaphor, setSelectedMetaphor] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [narrativeResult, setNarrativeResult] = useState('')
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [showDemo, setShowDemo] = useState(false)
  const [activeStep, setActiveStep] = useState(1)

  // 打字机效果
  useEffect(() => {
    const fullText = '概念隐喻驱动下的数据叙事生成系统'
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

      // 只有当两个文件都上传了才进入下一步
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

  // 辅助函数（替换所有any为明确类型）
  function getTrendDescription(data: DataItem[]): string {
    const chinaStart = data[0].china
    const chinaEnd = data[data.length - 1].china
    const usaValues = data.map((d) => d.usa)
    const usaMax = Math.max(...usaValues)
    const usaMin = Math.min(...usaValues)

    let desc = ''
    if (chinaEnd < chinaStart * 0.5) desc += '持续快速下降'
    if (usaMax > usaMin * 3) desc += (desc ? '；' : '') + '剧烈波动呈倒V型'
    return desc || '相对稳定'
  }

  function getScaleDescription(data: DataItem[]): string {
    const maxChina = Math.max(...data.map((d) => d.china))
    const maxUSA = Math.max(...data.map((d) => d.usa))
    const ratio = maxUSA / maxChina

    if (ratio > 10) return '规模悬殊的'
    if (ratio > 5) return '规模较大的'
    return '规模相当的'
  }

  function getVolatilityDescription(data: DataItem[]): '高' | '中' | '低' {
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

    if (avgUSAChange > avgChinaChange * 3) return '高'
    if (avgUSAChange > avgChinaChange * 1.5) return '中'
    return '低'
  }

  // 备用图片函数
  const getFallbackImage = (country: 'china' | 'usa'): string => {
    if (country === 'china') {
      return 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1024&h=1024&fit=crop'
    } else {
      return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1024&h=1024&fit=crop'
    }
  }

  // 备用提示词（极简版）
  const getFallbackPrompt = (
    data: DataItem[],
    country: 'china' | 'usa',
    metaphorType: (typeof metaphorTypes)[0]
  ): string => {
    const trend = getTrendDescription(data)
    return country === 'china'
      ? `${metaphorType.name}：${trend}的数据映射为东方水墨景观，红金色调，具象化数据特征`
      : `${metaphorType.name}：${trend}的数据映射为西方油画场景，蓝银色调，突出数据波动`
  }

  // AI 生成提示词函数（基于 IEEE 论文原理）
  // const generateMetaphorPromptByAI = async (
  //   data: DataItem[],
  //   country: 'china' | 'usa',
  //   metaphorType: (typeof metaphorTypes)[0]
  // ): Promise<string> => {
  //   const trend = getTrendDescription(data)
  //   const scale = getScaleDescription(data)
  //   const volatility = getVolatilityDescription(data)
  //   const values = data.map((d) => d[country])
  //   const maxVal = Math.max(...values)
  //   const minVal = Math.min(...values)

  //   const prompt = `基于概念隐喻理论（CMT）的${metaphorType.name}原理：${
  //     metaphorType.description
  //   }。
  //   数据特征：
  //   - 国家：${country === 'china' ? '中国' : '美国'}
  //   - 趋势：${trend}
  //   - 规模：${scale}
  //   - 波动性：${volatility}
  //   - 数值范围：${minVal}~${maxVal}
  //   要求：
  //   1. 严格遵循${metaphorType.name}定义（${metaphorType.example}）
  //   2. 将数据特征映射为视觉元素，不使用任何图表形式
  //   3. ${
  //     country === 'china'
  //       ? '采用东方美学风格（如水墨、工笔），主色调红金'
  //       : '采用西方艺术风格（如油画、数字艺术），主色调蓝银'
  //   }
  //   4. 突出数据核心特征，视觉隐喻准确，语言简洁具象（50-80字）`

  //   try {
  //     const response = await fetch(
  //       'http://localhost:3001/api/generate-prompt',
  //       {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({ prompt })
  //       }
  //     )

  //     if (!response.ok)
  //       throw new Error(`HTTP error! status: ${response.status}`)

  //     const result = (await response.json()) as PromptGenerationResponse
  //     return (
  //       result.content.trim() || getFallbackPrompt(data, country, metaphorType)
  //     )
  //   } catch (error) {
  //     console.error('AI 生成提示词失败，使用备用提示词', error)
  //     return getFallbackPrompt(data, country, metaphorType)
  //   }
  // }

  // 修改后的 AI 提示词生成函数（复用 generate-text 接口）
  const generateMetaphorPromptByAI = async (
    data: DataItem[],
    country: 'china' | 'usa',
    metaphorType: (typeof metaphorTypes)[0]
  ): Promise<string> => {
    const trend = getTrendDescription(data)
    const scale = getScaleDescription(data)
    const volatility = getVolatilityDescription(data)
    const values = data.map((d) => d[country])
    const maxVal = Math.max(...values)
    const minVal = Math.min(...values)

    // 构建文生图提示词的生成指令（明确要求生成提示词）
    const prompt = `你是专业的视觉隐喻设计师，擅长将数据特征转化为精准的文生图提示词。
基于概念隐喻理论（CMT）的${metaphorType.name}原理：${metaphorType.description}。
数据特征：
- 国家：${country === 'china' ? '中国' : '美国'}
- 趋势：${trend}
- 规模：${scale}
- 波动性：${volatility}
- 数值范围：${minVal}~${maxVal}
要求：
1. 严格遵循${metaphorType.name}定义（${metaphorType.example}），仅用该类型隐喻
2. 将数据特征映射为视觉元素，不使用任何图表形式，突出数据与视觉的定量关联
3. ${
      country === 'china'
        ? '采用东方美学风格（如水墨、工笔），主色调红金'
        : '采用西方艺术风格（如油画、数字艺术），主色调蓝银'
    }
4. 语言简洁具象（50-80字），包含场景、角色/元素、视觉变化（与数据趋势对应）
5. 输出仅保留文生图提示词，不要额外解释或分析`

    try {
      // 复用现有的 generate-text 接口，无需新增后端接口
      const response = await fetch('http://localhost:3001/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }) // 与文本分析接口参数格式一致
      })

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`)

      const result = (await response.json()) as TextGenerationResponse
      const content = result.content.trim()
      return content || getFallbackPrompt(data, country, metaphorType)
    } catch (error) {
      console.error('AI 生成提示词失败，使用备用提示词', error)
      return getFallbackPrompt(data, country, metaphorType)
    }
  }

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

  // 调用通义千问文生图API
  const generateImageWithQWEN = async (
    prompt: string,
    country: 'china' | 'usa'
  ): Promise<string> => {
    try {
      console.log(`调用通义千问文生图API (${country})...`)
      console.log('提示词:', prompt.substring(0, 150) + '...')

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
        console.log('成功获取图像URL:', imageUrl)
        return imageUrl
      } else {
        console.error('无法从响应中解析图像URL，使用备用图片')
        return getFallbackImage(country)
      }
    } catch (error) {
      console.error('图像生成失败:', error)
      return getFallbackImage(country)
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
    setGeneratedImages([])
    setNarrativeResult('')

    try {
      // 1. 准备数据描述
      const dataDescription = showDemo
        ? `中美疫情数据对比：
中国：2023年1月1000例，2月800例，3月500例，4月300例，5月200例，6月150例
美国：2023年1月5000例，2月8000例，3月12000例，4月15000例，5月10000例，6月7000例`
        : `中国数据文件：${uploadedChinaFile?.name}，美国数据文件：${uploadedUSFile?.name}`

      // 2. 获取隐喻类型信息
      const metaphorType = metaphorTypes.find((m) => m.id === selectedMetaphor)!
      const metaphorTypeName = metaphorType.name
      const metaphorDescription = metaphorType.description

      // 3. 构建文本分析提示词（移除可视化建议）
      const textPrompt = `你是一位数据科学家，请分析以下中美疫情数据对比：

数据：${dataDescription}

分析要求：
1. 使用${metaphorTypeName}(${metaphorDescription})进行分析
2. 对比两国数据趋势差异、规模差异和变化模式
3. 详细解释隐喻映射逻辑（如何将数据特征映射为叙事元素）
4. 用清晰的结构输出分析报告，包含以下部分：
   - 数据概览
   - 趋势分析
   - 隐喻解释
   - 对比结论
5. 语言简洁，避免冗余，不包含任何可视化建议`

      // 4. 并发调用文本生成API和图像提示词生成
      const textGenerationPromise = generateTextWithQWEN(textPrompt)

      // 生成图像提示词（AI 自主生成）
      const [chinaPrompt, usaPrompt] = await Promise.all([
        generateMetaphorPromptByAI(exampleData, 'china', metaphorType),
        generateMetaphorPromptByAI(exampleData, 'usa', metaphorType)
      ])

      // 5. 图像生成逻辑
      const imageGenerationPromise = (async () => {
        const images: GeneratedImage[] = []

        try {
          console.log('开始生成中国视角图像...')
          const chinaImageUrl = await generateImageWithQWEN(
            chinaPrompt,
            'china'
          )
          images.push({
            url: chinaImageUrl,
            description: `中国视角 - ${metaphorTypeName}`,
            country: 'china',
            prompt: chinaPrompt
          })
          console.log('中国图像生成成功')
        } catch (error) {
          console.error('中国图像生成失败:', error)
          images.push({
            url: getFallbackImage('china'),
            description: `中国视角 - ${metaphorTypeName}（备用图片）`,
            country: 'china',
            prompt: chinaPrompt
          })
        }

        try {
          console.log('开始生成美国视角图像...')
          const usaImageUrl = await generateImageWithQWEN(usaPrompt, 'usa')
          images.push({
            url: usaImageUrl,
            description: `美国视角 - ${metaphorTypeName}`,
            country: 'usa',
            prompt: usaPrompt
          })
          console.log('美国图像生成成功')
        } catch (error) {
          console.error('美国图像生成失败:', error)
          images.push({
            url: getFallbackImage('usa'),
            description: `美国视角 - ${metaphorTypeName}（备用图片）`,
            country: 'usa',
            prompt: usaPrompt
          })
        }

        return images
      })()

      // 6. 等待所有结果
      const [aiResponse, generatedImagesResult] = await Promise.all([
        textGenerationPromise,
        imageGenerationPromise
      ])

      // 7. 优化文本展示样式（Tailwind CSS）
      setNarrativeResult(`
<div class="space-y-6 text-gray-700">
  <div class="text-2xl font-bold text-gray-900 flex items-center">
    <span class="mr-2">📊</span> AI 生成中美数据对比分析报告
  </div>

  <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
    <div class="font-semibold text-purple-800">使用${metaphorTypeName}进行分析</div>
    <div class="text-sm text-purple-600 mt-1">${metaphorDescription}</div>
  </div>

  <!-- 数据概览 -->
  <div class="space-y-2">
    <div class="text-xl font-bold text-gray-800">数据概览</div>
    <div class="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
      ${
        aiResponse.includes('### 数据概览')
          ? aiResponse.split('### 数据概览')[1].split('### 趋势分析')[0].trim()
          : '中美两国数据覆盖2023年1-6月，中国数据呈持续下降趋势，美国数据呈倒V型波动。'
      }
    </div>
  </div>

  <!-- 趋势分析 -->
  <div class="space-y-2">
    <div class="text-xl font-bold text-gray-800">趋势分析</div>
    <div class="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
      ${
        aiResponse.includes('### 趋势分析')
          ? aiResponse.split('### 趋势分析')[1].split('### 隐喻解释')[0].trim()
          : '中国：1000→150，持续快速下降；美国：5000→15000→7000，3-4月达到峰值后回落。'
      }
    </div>
  </div>

  <!-- 隐喻解释 -->
  <div class="space-y-2">
    <div class="text-xl font-bold text-gray-800">隐喻解释</div>
    <div class="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
      ${
        aiResponse.includes('### 隐喻解释')
          ? aiResponse.split('### 隐喻解释')[1].split('### 对比结论')[0].trim()
          : `${metaphorTypeName}将数据特征映射为具象元素：中国数据下降对应${
              metaphorType.example.split('→')[1]
            }的平稳变化，美国数据波动对应冲突与转折。`
      }
    </div>
  </div>

  <!-- 对比结论 -->
  <div class="space-y-2">
    <div class="text-xl font-bold text-gray-800">对比结论</div>
    <div class="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
      ${
        aiResponse.includes('### 对比结论')
          ? aiResponse.split('### 对比结论')[1].trim()
          : '1. 趋势差异：中国平稳下降，美国剧烈波动；2. 规模差异：美国数据规模是中国的5-15倍；3. 隐喻价值：通过具象化表达增强数据理解与情感共鸣。'
      }
    </div>
  </div>

  <!-- 视觉叙事提示 -->
  <div class="mt-8 pt-6 border-t border-gray-200">
    <div class="text-xl font-bold text-gray-800 flex items-center">
      <span class="mr-2">🖼️</span> 生成的可视化对比图像
    </div>
    <div class="text-gray-600 mt-2">系统已根据${metaphorTypeName}生成中美对比可视化图像</div>
  </div>
</div>
      `)

      setGeneratedImages(generatedImagesResult)
      setIsGeneratingImages(false)
    } catch (error: unknown) {
      console.error('生成失败:', error)

      // 出错时的备用响应（Tailwind 样式）
      const metaphorType = metaphorTypes.find((m) => m.id === selectedMetaphor)!
      const fallbackResponse = `
<div class="space-y-6 text-gray-700">
  <div class="text-2xl font-bold text-gray-900 flex items-center">
    <span class="mr-2">📊</span> 中美数据对比分析报告（演示模式）
  </div>

  <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
    <div class="font-semibold text-purple-800">${metaphorType.name}分析</div>
    <div class="text-sm text-purple-600 mt-1">${metaphorType.description}</div>
  </div>

  <div class="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
    <div class="text-lg font-bold text-gray-800 mb-3">核心发现</div>
    <ul class="list-disc pl-5 space-y-2">
      <li>趋势对比：中国数据呈持续下降趋势（1000→150），美国呈倒V型（5000→15000→7000）</li>
      <li>规模差异：美国数据规模是中国的5-15倍</li>
      <li>波动性：美国波动更剧烈，中国变化更平稳</li>
    </ul>
  </div>

  <div class="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
    <div class="text-lg font-bold text-gray-800 mb-2">${
      metaphorType.name
    }解释</div>
    <div>${metaphorType.example}</div>
  </div>

  <div class="mt-8 pt-6 border-t border-gray-200">
    <div class="text-xl font-bold text-gray-800 flex items-center">
      <span class="mr-2">🖼️</span> 视觉叙事
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div class="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
        <div class="font-semibold text-red-600 mb-2">中国数据视角</div>
        <div class="text-sm text-gray-600">
          ${
            metaphorType.name === '实体隐喻'
              ? '沉稳的中国将军指挥防御部队，长城为背景，红金水墨风格'
              : metaphorType.name === '结构隐喻'
                ? '精密防御系统平稳运转，齿轮协同工作，深红金属灰色调'
                : metaphorType.name === '方位隐喻'
                  ? '红色柱体逐渐降低，空间开阔，红色渐变至浅粉'
                  : '红色绸带从山顶蜿蜒而下，融入湖面，云雾群山背景'
          }
        </div>
      </div>
      <div class="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
        <div class="font-semibold text-blue-600 mb-2">美国数据视角</div>
        <div class="text-sm text-gray-600">
          ${
            metaphorType.name === '实体隐喻'
              ? '坚韧的西方骑士战场应战，蓝银油画风格，戏剧性光影'
              : metaphorType.name === '结构隐喻'
                ? '冲突叙事场景起伏转折，深蓝暖黄对比，电影分镜风格'
                : metaphorType.name === '方位隐喻'
                  ? '蓝色能量粒子波动涌动，科幻数字艺术，蓝色渐变至深紫'
                  : '蓝色闪电劈下后消散，暴风雨天空背景，动态摄影风格'
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

      // 使用备用图片
      setGeneratedImages([
        {
          url: getFallbackImage('china'),
          description: '中国数据趋势 - 水墨风格（备用）',
          country: 'china',
          prompt: `${metaphorType.name}：中国数据的东方风格视觉隐喻`
        },
        {
          url: getFallbackImage('usa'),
          description: '美国数据趋势 - 油画风格（备用）',
          country: 'usa',
          prompt: `${metaphorType.name}：美国数据的西方风格视觉隐喻`
        }
      ])
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
          <p className="mt-1 text-sm text-gray-500">2023年上半年趋势分析</p>
        </div>
        <div className="rounded-full bg-gradient-to-r from-red-500 to-blue-500 px-3 py-1">
          <span className="text-xs font-semibold text-white">演示数据</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <div className="mr-2 size-3 rounded-full bg-red-500"></div>
            <span>中国数据</span>
          </div>
          <div className="flex items-center">
            <div className="mr-2 size-3 rounded-full bg-blue-500"></div>
            <span>美国数据</span>
          </div>
        </div>

        {exampleData.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {item.date}
              </span>
              <div className="flex space-x-4">
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
                  中美数据对比叙事
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 rounded-full bg-gradient-to-r from-red-50 to-blue-50 px-4 py-2">
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
          <div className="mb-6 inline-block rounded-full bg-gradient-to-r from-red-100 to-blue-100 px-4 py-1">
            <span className="text-sm font-semibold text-gray-700">
              基于概念隐喻理论 (CMT)
            </span>
          </div>
          <h1 className="mb-6 bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
            {typedText}
            {isTyping && (
              <span className="ml-2 inline-block h-12 w-1 animate-pulse bg-gradient-to-b from-red-500 to-blue-500"></span>
            )}
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600">
            将中美抽象数据通过概念隐喻映射为生动的对比叙事动画，让数据讲述跨文化故事
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
                    {['数据输入', '隐喻映射', 'AI生成', '对比输出'][step - 1]}
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
                    双数据输入
                  </h2>
                  <p className="text-gray-500">分别上传中国和美国的数据文件</p>
                </div>
              </div>

              {!showDemo ? (
                <div className="space-y-6">
                  {/* 中国数据上传 */}
                  <div className="group relative rounded-xl border-2 border-dashed border-red-300 p-8 text-center transition-all hover:border-red-400 hover:bg-red-50/30">
                    <div className="relative mb-4 flex justify-center">
                      <div className="rounded-full bg-gradient-to-r from-red-100 to-pink-100 p-3">
                        <div className="text-3xl text-red-600">🇨🇳</div>
                      </div>
                    </div>
                    <p className="mb-3 font-medium text-gray-700">
                      中国数据文件
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
                  <div className="group relative rounded-xl border-2 border-dashed border-blue-300 p-8 text-center transition-all hover:border-blue-400 hover:bg-blue-50/30">
                    <div className="relative mb-4 flex justify-center">
                      <div className="rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 p-3">
                        <div className="text-3xl text-blue-600">🇺🇸</div>
                      </div>
                    </div>
                    <p className="mb-3 font-medium text-gray-700">
                      美国数据文件
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

                  {/* 状态指示器 */}
                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="flex justify-between">
                      <div
                        className={`flex items-center ${
                          uploadedChinaFile ? 'text-green-600' : 'text-gray-500'
                        }`}
                      >
                        <span className="mr-2">
                          {uploadedChinaFile ? '✓' : '○'}
                        </span>
                        <span>中国数据</span>
                      </div>
                      <div
                        className={`flex items-center ${
                          uploadedUSFile ? 'text-green-600' : 'text-gray-500'
                        }`}
                      >
                        <span className="mr-2">
                          {uploadedUSFile ? '✓' : '○'}
                        </span>
                        <span>美国数据</span>
                      </div>
                    </div>
                    <div className="mt-2 text-center text-sm text-gray-500">
                      {uploadedChinaFile && uploadedUSFile
                        ? '✓ 两个文件已就绪，可以进行隐喻映射'
                        : '请上传中国和美国两个数据文件'}
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
                  <h2 className="text-2xl font-bold text-gray-900">隐喻映射</h2>
                  <p className="text-gray-500">选择数据转换的叙事框架</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {metaphorTypes.map((metaphor) => (
                  <div
                    key={metaphor.id}
                    className={`group relative cursor-pointer rounded-xl border-2 p-5 transition-all duration-300 ${
                      selectedMetaphor === metaphor.id
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-white shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => {
                      setSelectedMetaphor(metaphor.id)
                      setActiveStep(3)
                    }}
                  >
                    {selectedMetaphor === metaphor.id && (
                      <div className="absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500">
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
                                ? 'bg-blue-100 text-blue-700'
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
                    正在生成中美对比叙事...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="mr-2">🌍</span>
                    生成中美对比叙事
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
                  <h2 className="text-2xl font-bold text-gray-900">对比结果</h2>
                  <p className="text-gray-500">查看AI生成的中美对比叙事</p>
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
                      AI正在分析数据并生成叙事...
                    </p>
                    <p className="mt-2 text-gray-500">
                      正在结合隐喻类型生成对比脚本
                    </p>
                  </div>

                  {/* 图像生成指示器 */}
                  {isGeneratingImages && (
                    <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-6">
                      <div className="mb-4 flex items-center">
                        <div className="mr-3 flex size-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500">
                          <span className="text-xl text-white">🖼️</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">
                            生成可视化图像
                          </h4>
                          <p className="text-sm text-gray-600">
                            调用通义千问文生图API生成对比图像
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-white p-4 text-center">
                          <div className="mb-2 flex justify-center">
                            <div className="size-8 animate-pulse rounded-full bg-gradient-to-r from-red-200 to-red-100"></div>
                          </div>
                          <div className="h-4 w-3/4 animate-pulse rounded bg-gradient-to-r from-red-100 to-red-50"></div>
                          <div className="mt-2 text-sm font-medium text-red-600">
                            生成中国视角...
                          </div>
                        </div>
                        <div className="rounded-lg bg-white p-4 text-center">
                          <div className="mb-2 flex justify-center">
                            <div className="size-8 animate-pulse rounded-full bg-gradient-to-r from-blue-200 to-blue-100"></div>
                          </div>
                          <div className="h-4 w-3/4 animate-pulse rounded bg-gradient-to-r from-blue-100 to-blue-50"></div>
                          <div className="mt-2 text-sm font-medium text-blue-600">
                            生成美国视角...
                          </div>
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

                  {generatedImages.length > 0 && (
                    <div>
                      <div className="grid grid-cols-2 gap-6">
                        {generatedImages.map((img, index) => (
                          <div
                            key={index}
                            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-lg transition-all hover:shadow-2xl"
                          >
                            <div className="relative aspect-square overflow-hidden">
                              <img
                                src={img.url}
                                alt={img.description}
                                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = getFallbackImage(img.country)
                                }}
                              />
                              <div
                                className={`absolute inset-x-0 top-0 p-4 ${
                                  img.country === 'china'
                                    ? 'bg-gradient-to-r from-red-600/90 to-red-500/90'
                                    : 'bg-gradient-to-r from-blue-600/90 to-blue-500/90'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <span className="mr-2 text-lg">
                                      {img.country === 'china' ? '🇨🇳' : '🇺🇸'}
                                    </span>
                                    <span className="font-bold text-white">
                                      {img.country === 'china'
                                        ? '中国视角'
                                        : '美国视角'}
                                    </span>
                                  </div>
                                  <div className="rounded-full bg-white/20 px-2 py-1">
                                    <span className="text-xs font-semibold text-white">
                                      {
                                        metaphorTypes.find(
                                          (m) => m.id === selectedMetaphor
                                        )?.name
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="p-4">
                              <p className="mb-3 text-sm text-gray-600">
                                {img.description}
                              </p>
                              <button
                                onClick={() => {
                                  // 显示提示词详情
                                  alert(`提示词详情：\n\n${img.prompt}`)
                                }}
                                className="w-full rounded-lg bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:from-gray-200 hover:to-gray-100"
                              >
                                查看生成提示词
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4 border-t border-gray-200 pt-6">
                    <button
                      onClick={() => {
                        // 导出功能
                        const content = `# 中美对比叙事报告_${
                          new Date().toISOString().split('T')[0]
                        }
## 分析类型：${metaphorTypes.find((m) => m.id === selectedMetaphor)?.name}
## 核心结论
${
  narrativeResult.includes(
    '<div class="text-xl font-bold text-gray-800">对比结论</div>'
  )
    ? narrativeResult
        .split('<div class="text-xl font-bold text-gray-800">对比结论</div>')[1]
        .split('</div>')[1]
        .trim()
    : '中国数据平稳下降，美国数据剧烈波动，规模差异显著'
}

## 生成的图像
${generatedImages
  .map(
    (img, i) => `
### ${i + 1}. ${img.description}
- 提示词: ${img.prompt}
- 图像URL: ${img.url}`
  )
  .join('')}`

                        const blob = new Blob([content], {
                          type: 'text/markdown'
                        })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `中美对比叙事_${
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
                        setGeneratedImages([])
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
                    <div className="relative flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-white to-blue-50">
                      <div className="text-4xl">🌏</div>
                    </div>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-gray-900">
                    等待生成对比叙事
                  </h3>
                  <p className="text-gray-600">
                    上传中美两个数据文件并选择隐喻类型后，将在此处显示生成的对比叙事
                  </p>
                  <div className="mt-6 inline-block rounded-full bg-gradient-to-r from-red-100 via-purple-100 to-blue-100 px-4 py-2">
                    <span className="text-sm font-medium text-gray-700">
                      中国数据 + 美国数据 + 隐喻 = 对比故事 + 可视化图像
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 理论说明 */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-gray-900 p-8 text-white shadow-2xl">
              <h2 className="mb-4 text-2xl font-bold">对比叙事理论</h2>
              <div className="space-y-4">
                <div className="rounded-xl bg-gradient-to-r from-red-900/50 to-blue-900/50 p-4">
                  <h3 className="mb-2 font-bold text-red-300">
                    双数据对比框架
                  </h3>
                  <p className="text-sm text-gray-300">
                    通过红蓝对比色系，构建中美数据对比的视觉和叙事框架。
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-4">
                  <h3 className="mb-2 font-bold text-purple-300">
                    跨文化叙事策略
                  </h3>
                  <p className="text-sm text-gray-300">
                    利用概念隐喻理论，将文化差异转化为叙事冲突和发展动力。
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-r from-emerald-900/50 to-green-900/50 p-4">
                  <h3 className="mb-2 font-bold text-emerald-300">
                    AI增强对比分析
                  </h3>
                  <p className="text-sm text-gray-300">
                    通义千问生成对比叙事和可视化图像，实现深度分析。
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
              <h3 className="text-lg font-bold text-white">毕业设计项目</h3>
            </div>
            <p className="mb-4 text-2xl font-bold text-white">
              《基于概念隐喻的中美数据对比叙事生成系统》
            </p>
            <div className="mt-8 flex justify-center space-x-6">
              <div className="rounded-lg bg-gradient-to-r from-red-500/10 to-red-400/10 px-4 py-2">
                <div className="text-sm text-red-300">中国数据</div>
                <div className="font-medium text-white">
                  红色主题 · 东方视角
                </div>
              </div>
              <div className="rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-400/10 px-4 py-2">
                <div className="text-sm text-blue-300">美国数据</div>
                <div className="font-medium text-white">
                  蓝色主题 · 西方视角
                </div>
              </div>
              <div className="rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-4 py-2">
                <div className="text-sm text-purple-300">对比分析</div>
                <div className="font-medium text-white">
                  红蓝对比 · 跨文化叙事
                </div>
              </div>
            </div>
            <p className="mt-8 text-sm text-gray-400">
              © 2026 毕业设计 · 中美数据对比叙事实验室
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
