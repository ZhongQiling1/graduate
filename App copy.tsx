import { useState, useEffect } from 'react'
import OpenAI from 'openai'

// 概念隐喻类型
const metaphorTypes = [
  {
    id: 1,
    name: '实体隐喻',
    description: '抽象概念拟人化',
    icon: '👤',
    example: '病毒数据 → 入侵军团',
    color: 'from-blue-400 to-cyan-400',
    bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50'
  },
  {
    id: 2,
    name: '结构隐喻',
    description: '数据趋势映射为情节',
    icon: '📈',
    example: '波峰 → 激烈冲突',
    color: 'from-emerald-400 to-green-400',
    bgColor: 'bg-gradient-to-br from-emerald-50 to-green-50'
  },
  {
    id: 3,
    name: '方位隐喻',
    description: '空间位置表达情绪',
    icon: '🧭',
    example: '负面数据 → 冷色调',
    color: 'from-violet-400 to-purple-400',
    bgColor: 'bg-gradient-to-br from-violet-50 to-purple-50'
  },
  {
    id: 4,
    name: '图像隐喻',
    description: '图形相似性映射',
    icon: '🎨',
    example: '曲线 → 山峰/波浪',
    color: 'from-pink-400 to-rose-400',
    bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50'
  }
]

// 示例数据
const exampleData = [
  { date: '2023-01', china: 1000, usa: 5000 },
  { date: '2023-02', china: 800, usa: 8000 },
  { date: '2023-03', china: 500, usa: 12000 },
  { date: '2023-04', china: 300, usa: 15000 },
  { date: '2023-05', china: 200, usa: 10000 },
  { date: '2023-06', china: 150, usa: 7000 }
]

function App() {
  const [typedText, setTypedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [uploadedChinaFile, setUploadedChinaFile] = useState<File | null>(null)
  const [uploadedUSFile, setUploadedUSFile] = useState<File | null>(null)
  const [selectedMetaphor, setSelectedMetaphor] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [narrativeResult, setNarrativeResult] = useState('')
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
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

  // 添加这些模板函数
  // 实体隐喻模板：将数据拟人化为角色
  function getEntityMetaphorPrompt(
    data: any,
    country: 'china' | 'usa'
  ): string {
    const trend = getTrendDescription(data)
    const scale = getScaleDescription(data)

    if (country === 'china') {
      return `一幅充满东方美学的水墨风格画面，描绘一个${
        trend.includes('下降') ? '沉稳智慧' : '英勇果断'
      }的${scale}中国将军。将军身着传统红色战甲，${
        trend.includes('下降')
          ? '从容不迫地指挥着一支纪律严明的防御部队，有条不紊地化解危机'
          : '率领着精锐部队迅速应对挑战'
      }。画面背景是蜿蜒的万里长城，象征坚固的防御体系。整体色调以红金为主，体现东方文化的庄重与智慧。风格：写实水墨画，细节精致，富有叙事性。`
    } else {
      return `一幅充满动态感的西方油画风格画面，描绘一个${
        trend.includes('波动') ? '经历起伏但坚韧' : '面临挑战'
      }的${scale}西方骑士。骑士身着蓝色铠甲，${
        trend.includes('波动')
          ? '在激烈的战场上时而进攻时而防守，展现出顽强的战斗精神'
          : '面对汹涌的敌人浪潮勇敢应战'
      }。画面背景是广阔的战场或城市，体现冲突与对抗。整体色调以蓝银为主，带有强烈的戏剧性光影对比。风格：史诗级油画，富有张力，充满动感。`
    }
  }

  // 结构隐喻模板：将数据趋势映射为情节
  function getStructuralMetaphorPrompt(
    data: any,
    country: 'china' | 'usa'
  ): string {
    const trend = getTrendDescription(data)
    const volatility = getVolatilityDescription(data)

    if (country === 'china') {
      return `一幅表现${trend}过程的精密机械结构图。画面中心是一个${
        volatility === '低' ? '运转平稳、齿轮精密咬合' : '正在高效调整'
      }的${trend.includes('下降') ? '防御系统' : '应对机制'}。${
        trend.includes('下降')
          ? '各个部件协同工作，有条不紊地将威胁逐步化解'
          : '系统各部分迅速响应，有效控制局势'
      }。采用工程制图风格，线条精确，配色以深红和金属灰为主，体现系统性与效率。画面中带有数据流和状态指示灯，展示实时运作情况。`
    } else {
      return `一幅表现${trend}过程的戏剧性叙事场景。画面展现一个${
        volatility === '高' ? '充满起伏转折' : '持续发展'
      }的${trend.includes('倒V型') ? '冲突与解决' : '挑战与应对'}故事。${
        trend.includes('倒V型')
          ? '场景从平静到高潮再回归平静，人物表情和动作随之变化'
          : '不同角色在复杂环境中互动，形成动态平衡'
      }。采用电影分镜风格，多个场景并列或重叠，色调以深蓝和暖黄对比为主，富有情感张力。画面中包含象征性的视觉元素，如海浪、山峰或迷宫。`
    }
  }

  // 方位隐喻模板：用空间位置表达数据
  function getOrientationalMetaphorPrompt(
    data: any,
    country: 'china' | 'usa'
  ): string {
    const values = data.map((d: any) => (country === 'china' ? d.china : d.usa))
    const maxVal = Math.max(...values)
    const minVal = Math.min(...values)

    if (country === 'china') {
      return `一幅抽象的空间构图，用垂直方向表达数据变化。画面中${values
        .map((val, i) => {
          const height = ((val - minVal) / (maxVal - minVal)) * 80 + 10
          return `一个红色的柱体从画面底部向上延伸${height}%高度`
        })
        .join('，')}。所有红色柱体${
        data[data.length - 1][country] < data[0][country]
          ? '呈现从左到右逐渐降低的趋势'
          : '变化趋势明显'
      }。背景是简洁的网格线，柱体之间有微妙的渐变连接，形成整体感。上方空间开阔明亮，下方沉稳，象征${
        data[data.length - 1][country] < data[0][country]
          ? '压力释放和局势向好'
          : '数据的空间分布'
      }。色调：红色渐变到浅粉，背景为浅灰。风格：极简主义，几何抽象。`
    } else {
      return `一幅动态的空间能量场图，用密集度表达数据强度。画面中心${values
        .map((val, i) => {
          const intensity = (val / maxVal) * 100
          return `一片蓝色能量粒子以${intensity}%的浓度在对应位置涌动`
        })
        .join('，')}。能量场${
        data.some(
          (d: any, i: number) =>
            i > 0 && Math.abs(d.usa - data[i - 1].usa) > 1000
        )
          ? '波动剧烈，形成明显的波峰波谷'
          : '变化连续'
      }。整体构图${
        values[values.length - 1] < values[0] ? '呈现收缩态势' : '保持扩张感'
      }。色调：蓝色渐变到深紫，高光部分为亮蓝。风格：科幻数字艺术，粒子效果。`
    }
  }

  // 图像隐喻模板：基于图形相似性映射
  function getImagisticMetaphorPrompt(
    data: any,
    country: 'china' | 'usa'
  ): string {
    const values = data.map((d: any) => (country === 'china' ? d.china : d.usa))
    const trend = getTrendDescription(data)

    if (country === 'china') {
      return `一幅将数据曲线转化为自然景观的视觉隐喻图。${
        trend.includes('下降')
          ? '一条红色的绸带从山顶优雅地蜿蜒而下，如同瀑布般流畅地降落至山谷'
          : '红色的枫叶沿着溪流飘落，形成优美的下降轨迹'
      }。${values[0] > 1000 ? '起始处绸带/叶片密集宽大' : '起始处特征明显'}，${
        values[values.length - 1] < 200
          ? '末端逐渐收窄变细，最终融入宁静的湖面'
          : '变化过程平滑自然'
      }。背景是${
        trend.includes('下降')
          ? '云雾缭绕的群山，象征挑战与高度'
          : '秋日的山林，体现时间流逝'
      }。整体氛围${
        trend.includes('下降') ? '从紧张到舒缓' : '富有诗意'
      }。色调：中国红、墨绿、淡金。风格：工笔画与写意结合。`
    } else {
      return `一幅将数据波动转化为物理现象的视觉隐喻图。${
        trend.includes('倒V型')
          ? '一道蓝色的闪电在夜空中剧烈曲折劈下，瞬间达到最高点后分散成无数电火花逐渐消散'
          : '蓝色的海浪猛烈拍击礁石，激起巨大浪花后回落'
      }。${
        values[2] === 12000
          ? '中间部分能量最强，亮度最高'
          : '变化过程充满爆发力'
      }，${
        values[values.length - 1] < values[2]
          ? '后续逐渐平息，但余波仍在扩散'
          : '整体动态感强烈'
      }。背景是${
        trend.includes('倒V型')
          ? '暴风雨中的天空，乌云密布'
          : '汹涌的大海，波涛起伏'
      }。整体效果震撼，充满力量感。色调：深蓝、亮蓝、紫色、白色高光。风格：动态摄影与数字合成。`
    }
  }

  // 辅助函数：获取数据特征描述
  function getTrendDescription(data: any): string {
    const chinaStart = data[0].china
    const chinaEnd = data[data.length - 1].china
    const usaValues = data.map((d: any) => d.usa)
    const usaMax = Math.max(...usaValues)
    const usaMin = Math.min(...usaValues)

    let desc = ''
    if (chinaEnd < chinaStart * 0.5) desc += '持续快速下降'
    if (usaMax > usaMin * 3) desc += (desc ? '；' : '') + '剧烈波动呈倒V型'
    return desc || '相对稳定'
  }

  function getScaleDescription(data: any): string {
    const maxChina = Math.max(...data.map((d: any) => d.china))
    const maxUSA = Math.max(...data.map((d: any) => d.usa))
    const ratio = maxUSA / maxChina

    if (ratio > 10) return '规模悬殊的'
    if (ratio > 5) return '规模较大的'
    return '规模相当的'
  }

  function getVolatilityDescription(data: any): string {
    const chinaChanges = []
    const usaChanges = []

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

  // 模拟生成数据叙事
  const handleGenerateNarrative = async () => {
    if ((!uploadedChinaFile || !uploadedUSFile) && !showDemo) {
      alert('请先上传中国和美国两个数据文件')
      return
    }

    setIsGenerating(true)
    setActiveStep(4)

    try {
      // 1. 准备数据描述
      const dataDescription = showDemo
        ? `中美疫情数据对比：
中国：2023年1月1000例，2月800例，3月500例，4月300例，5月200例，6月150例
美国：2023年1月5000例，2月8000例，3月12000例，4月15000例，5月10000例，6月7000例`
        : `中国数据文件：${uploadedChinaFile?.name}，美国数据文件：${uploadedUSFile?.name}`

      // 2. 构建提示词
      const metaphorTypeName = metaphorTypes.find(
        (m) => m.id === selectedMetaphor
      )?.name

      const enhancedPrompt = `你是一位数据科学家，请分析以下中美疫情数据对比：

数据：${dataDescription}

分析要求：
1. 使用${metaphorTypeName}(${metaphorTypes.find(
        (m) => m.id === selectedMetaphor
      )?.description})进行分析
2. 对比两国数据趋势差异
3. 分析规模差异和变化模式
4. 提供可视化建议
5. 用Markdown格式输出分析报告`

      // 3. 使用OpenAI兼容模式调用API
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_DASHSCOPE_API_KEY,
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        dangerouslyAllowBrowser: true // 允许在浏览器中使用
      })

      console.log('使用OpenAI兼容模式调用API...')

      const completion = await openai.chat.completions.create({
        model: 'qwen-turbo', // 或 'qwen-plus', 'qwen-max'
        messages: [
          {
            role: 'system',
            content:
              '你是一位精通数据分析和概念隐喻的数据科学家，擅长生成详细的数据对比分析报告。'
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })

      console.log('API调用成功！', completion)

      // 4. 处理响应
      const aiResponse =
        completion.choices[0]?.message?.content || '未收到有效响应'

      // 5. 根据选择的隐喻类型生成图片描述提示词
      const imagePrompts = generateImagePrompts(selectedMetaphor, exampleData)

      // 6. 更新UI - 包含文字报告和图片提示词
      setNarrativeResult(`
## 📊 AI生成中美数据对比分析报告

### 🎭 使用${metaphorTypeName}进行分析

${aiResponse}

### 🖼️ 生成的视觉叙事提示词

**中国数据视角：**
${imagePrompts.china}

**美国数据视角：**
${imagePrompts.usa}

*提示：以上描述可用于文生图AI工具生成对比可视化图片*

---
*由通义千问API（OpenAI兼容模式）生成*
    `)

      // 7. 使用示例图片
      setGeneratedImages([
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop'
      ])
    } catch (error: unknown) {
      console.error('API调用失败详情:', error)

      // 类型保护检查
      if (error instanceof Error) {
        console.error('错误信息:', error.message)
      }

      // 处理 Axios 或其他 HTTP 错误
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const httpError = error as {
          response?: { status?: number; data?: unknown }
        }
        console.error('响应状态:', httpError.response?.status)
        console.error('响应数据:', httpError.response?.data)
      }

      // 出错时的备用响应 - 包含图片提示词
      const fallbackResponse = `## 中美数据对比分析报告（演示模式）

### ${metaphorTypes.find((m) => m.id === selectedMetaphor)?.name}分析

**核心发现**：
1. **趋势对比**：中国数据呈持续下降趋势（1000→150），美国呈倒V型（5000→15000→7000）
2. **规模差异**：美国数据规模是中国的5-15倍
3. **波动性**：美国波动更剧烈，中国变化更平稳

**${metaphorTypes.find((m) => m.id === selectedMetaphor)?.name}解释**：
${metaphorTypes.find((m) => m.id === selectedMetaphor)?.example}

### 🖼️ 生成的视觉叙事提示词

**中国数据视角：**
${getMetaphorPrompt(selectedMetaphor, exampleData, 'china')}

**美国数据视角：**
${getMetaphorPrompt(selectedMetaphor, exampleData, 'usa')}

**可视化建议**：
- 红蓝对比折线图展示趋势差异
- 双Y轴图表展示规模对比
- 变化率柱状图对比波动性

---
*网络连接问题，显示本地分析结果*`

      setNarrativeResult(fallbackResponse)

      setGeneratedImages([
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop'
      ])
    } finally {
      setIsGenerating(false)
    }
  }

  // 新增：生成图片提示词的主函数
  function generateImagePrompts(metaphorId: number, data: any) {
    let chinaPrompt = ''
    let usPrompt = ''

    switch (metaphorId) {
      case 1: // 实体隐喻
        chinaPrompt = getEntityMetaphorPrompt(data, 'china')
        usPrompt = getEntityMetaphorPrompt(data, 'usa')
        break
      case 2: // 结构隐喻
        chinaPrompt = getStructuralMetaphorPrompt(data, 'china')
        usPrompt = getStructuralMetaphorPrompt(data, 'usa')
        break
      case 3: // 方位隐喻
        chinaPrompt = getOrientationalMetaphorPrompt(data, 'china')
        usPrompt = getOrientationalMetaphorPrompt(data, 'usa')
        break
      case 4: // 图像隐喻
        chinaPrompt = getImagisticMetaphorPrompt(data, 'china')
        usPrompt = getImagisticMetaphorPrompt(data, 'usa')
        break
      default:
        chinaPrompt = getEntityMetaphorPrompt(data, 'china')
        usPrompt = getEntityMetaphorPrompt(data, 'usa')
    }

    return { china: chinaPrompt, usa: usPrompt }
  }

  // 新增：通用隐喻提示词获取函数（用于错误处理）
  function getMetaphorPrompt(
    metaphorId: number,
    data: any,
    country: 'china' | 'usa'
  ): string {
    switch (metaphorId) {
      case 1:
        return getEntityMetaphorPrompt(data, country)
      case 2:
        return getStructuralMetaphorPrompt(data, country)
      case 3:
        return getOrientationalMetaphorPrompt(data, country)
      case 4:
        return getImagisticMetaphorPrompt(data, country)
      default:
        return getEntityMetaphorPrompt(data, country)
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
                <div className="py-16 text-center">
                  <div className="relative mx-auto mb-6">
                    <div className="absolute inset-0 animate-ping rounded-full bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 opacity-20"></div>
                    <div className="relative flex size-24 items-center justify-center rounded-full bg-gradient-to-r from-red-100 via-purple-100 to-blue-100">
                      <div className="size-16 animate-spin rounded-full border-4 border-red-200 border-t-blue-500"></div>
                    </div>
                  </div>
                  <p className="text-lg font-medium text-gray-700">
                    AI正在创作中美对比叙事...
                  </p>
                  <p className="mt-2 text-gray-500">
                    正在结合隐喻类型生成对比脚本和视觉元素
                  </p>
                  <div className="mt-6 flex justify-center space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="size-2 animate-pulse rounded-full bg-gradient-to-r from-red-500 via-purple-500 to-blue-500"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      ></div>
                    ))}
                  </div>
                </div>
              ) : narrativeResult ? (
                <div className="space-y-8">
                  <div className="prose prose-lg max-w-none">
                    <div
                      className="whitespace-pre-line text-gray-700 [&_h3]:mb-4 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-gray-900 [&_p]:mb-4 [&_p]:text-gray-700 [&_strong]:font-bold [&_strong]:text-blue-600"
                      dangerouslySetInnerHTML={{
                        __html: narrativeResult.replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong>$1</strong>'
                        )
                      }}
                    />
                  </div>

                  {generatedImages.length > 0 && (
                    <div>
                      <h4 className="mb-4 flex items-center text-xl font-bold text-gray-900">
                        <span className="mr-2">🖼️</span>
                        生成的视觉素材
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        {generatedImages.map((img, index) => (
                          <div
                            key={index}
                            className="group relative aspect-video overflow-hidden rounded-xl shadow-lg transition-transform hover:scale-105"
                          >
                            <img
                              src={img}
                              alt={`生成的图片 ${index + 1}`}
                              className="size-full object-cover transition-transform group-hover:scale-110"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                              <div className="text-sm font-semibold text-white">
                                {index === 0
                                  ? '中国视角'
                                  : index === 1
                                    ? '美国视角'
                                    : '对比场景'}{' '}
                                {index + 1}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4 border-t border-gray-200 pt-6">
                    <button className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105">
                      📥 导出对比报告
                    </button>
                    <button className="flex-1 rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-transform hover:scale-105 hover:bg-gray-50">
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
                      中国数据 + 美国数据 + 隐喻 = 对比故事
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
                    GPT-4生成对比叙事，可视化工具创建对比图表，实现深度分析。
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
