import { DataAnalysisResult } from './interface'
interface DataFeatures {
  size_ratio?: number
  volatility_ratio?: number
  [key: string]: unknown // 允许其他未定义的属性
}

// 行业特征语义知识库
export const INDUSTRY_SEMANTIC_DATABASE = {
  // 医疗/健康行业
  medical_health: {
    keywords: [
      '病例',
      '患者',
      '医院',
      '治疗',
      '药物',
      '疫苗',
      '健康',
      '医疗',
      '死亡',
      '康复',
      '感染',
      '病毒',
      '疫情',
      '疾控',
      '防疫'
    ],
    objects: {
      // 实体隐喻：需要可堆叠的具体物体
      physical_collections: [
        '药瓶',
        '医疗箱',
        '十字架',
        '体温计',
        '心电图',
        '救护车',
        '医疗包',
        '呼吸机',
        '防护服',
        '口罩',
        '针筒',
        '药片',
        '病历夹'
      ],
      // 结构隐喻：需要可建造的物体
      construction_progress: [
        '方舱医院',
        '隔离墙',
        '医疗塔',
        '健康大楼',
        '防疫堡垒',
        '生命之桥',
        '康复中心',
        '检测站',
        '救治所'
      ],
      // 方位隐喻：需要可分布的物体
      density_distribution: [
        '病例点',
        '感染单元',
        '疫苗颗粒',
        '防疫节点',
        '健康细胞',
        '康复分子'
      ]
    },
    color_scheme: {
      warm: ['白色', '红色', '橙色', '粉红色'], // 暖色调 - 代表威胁/紧急
      cool: ['蓝色', '绿色', '青色', '淡蓝色'] // 冷色调 - 代表安全/健康
    }
  },

  // 金融/经济行业
  finance_economy: {
    keywords: [
      '销售',
      '收入',
      '利润',
      '成本',
      '预算',
      '财务',
      '金额',
      '货币',
      '投资',
      '股票',
      '基金',
      '贷款',
      '税收',
      '经济'
    ],
    objects: {
      physical_collections: [
        '金币',
        '货币堆',
        '支票',
        '财报文档',
        '股票图表',
        '信用卡',
        '钱包',
        '收银机',
        '财务报表',
        '金条',
        '硬币',
        '账本'
      ],
      construction_progress: [
        '银行大厦',
        '金融中心',
        '经济数据塔',
        '财务框架',
        '投资楼',
        '财富金字塔'
      ],
      density_distribution: [
        '资金点',
        '交易颗粒',
        '投资节点',
        '经济单元',
        '货币粒子'
      ]
    },
    color_scheme: {
      warm: ['金色', '橙色', '黄色', '琥珀色'], // 暖色调 - 代表增值/利润
      cool: ['银色', '蓝色', '灰色', '青色'] // 冷色调 - 代表成本/支出
    }
  },

  // 教育/学术行业
  education_academic: {
    keywords: [
      '学生',
      '教师',
      '课程',
      '成绩',
      '学校',
      '教育',
      '学习',
      '考试',
      '论文',
      '研究',
      '学位',
      '学术'
    ],
    objects: {
      physical_collections: [
        '书籍',
        '学位帽',
        '粉笔',
        '成绩单',
        '笔记本',
        '试卷',
        '书包',
        '计算器',
        '尺子',
        '地球仪',
        '字典',
        '实验器材'
      ],
      construction_progress: [
        '学校建筑',
        '知识塔',
        '教育框架',
        '学习中心',
        '学术大楼',
        '智慧金字塔'
      ],
      density_distribution: [
        '知识颗粒',
        '学生点',
        '课程单元',
        '学分节点',
        '学术元素'
      ]
    },
    color_scheme: {
      warm: ['橙色', '黄色', '暖灰色', '米色'], // 暖色调 - 代表活力/热情
      cool: ['蓝色', '绿色', '青色', '冷灰色'] // 冷色调 - 代表冷静/理性
    }
  },

  // 科技/互联网行业
  technology_internet: {
    keywords: [
      '用户',
      '流量',
      '点击',
      '数据',
      '服务器',
      '应用',
      '软件',
      '技术',
      '网络',
      '系统',
      '代码',
      '算法',
      '开发'
    ],
    objects: {
      physical_collections: [
        '服务器堆',
        '数据块',
        '网络节点',
        '芯片',
        '代码块',
        'U盘',
        '硬盘',
        '主板',
        '处理器',
        '内存条',
        '电缆',
        '路由器'
      ],
      construction_progress: [
        '数据中心',
        '网络架构',
        '系统框架',
        '技术大厦',
        '代码塔',
        '云端结构'
      ],
      density_distribution: [
        '数据点',
        '连接颗粒',
        '信号节点',
        '流量单元',
        '信息粒子'
      ]
    },
    color_scheme: {
      warm: ['亮蓝色', '紫色', '品红', '霓虹色'], // 暖色调 - 代表活跃/创新
      cool: ['深蓝', '青色', '银灰', '冷白'] // 冷色调 - 代表稳定/可靠
    }
  },

  // 零售/电商行业
  retail_ecommerce: {
    keywords: [
      '商品',
      '库存',
      '订单',
      '客户',
      '购物',
      '销售',
      '店铺',
      '产品',
      '营销',
      '促销',
      '物流',
      '供应链'
    ],
    objects: {
      physical_collections: [
        '购物车',
        '货架',
        '商品盒',
        '购物袋',
        '价格标签',
        '收据',
        '包装盒',
        '展示柜',
        '商品堆',
        '库存箱',
        '货柜'
      ],
      construction_progress: [
        '商场建筑',
        '供应链塔',
        '物流中心',
        '销售框架',
        '库存大楼'
      ],
      density_distribution: [
        '商品点',
        '订单颗粒',
        '客户节点',
        '库存单元',
        '供应链元素'
      ]
    },
    color_scheme: {
      warm: ['红色', '橙色', '黄色', '暖色'], // 暖色调 - 代表热销/促销
      cool: ['蓝色', '绿色', '冷色', '中性色'] // 冷色调 - 代表常规/库存
    }
  },

  // 制造/工业行业
  manufacturing_industry: {
    keywords: [
      '产量',
      '设备',
      '生产线',
      '产品',
      '制造',
      '工厂',
      '机器',
      '零件',
      '质量',
      '生产',
      '工业',
      '装配'
    ],
    objects: {
      physical_collections: [
        '齿轮堆',
        '工具集',
        '零件箱',
        '生产线',
        '产品堆',
        '螺丝',
        '螺母',
        '机械臂',
        '发动机',
        '轴承',
        '模具',
        '成品箱'
      ],
      construction_progress: [
        '工厂建筑',
        '生产线框架',
        '工业塔',
        '制造中心',
        '装配大楼'
      ],
      density_distribution: [
        '零件点',
        '产品颗粒',
        '生产节点',
        '质量单元',
        '工业元素'
      ]
    },
    color_scheme: {
      warm: ['橙色', '红色', '铜色', '暖灰色'], // 暖色调 - 代表高效/运转
      cool: ['深灰', '蓝色', '银色', '冷灰色'] // 冷色调 - 代表暂停/维护
    }
  },

  // 环境/能源行业
  environment_energy: {
    keywords: [
      '排放',
      '能源',
      '污染',
      '资源',
      '环保',
      '可持续',
      '绿色',
      '气候',
      '生态',
      '碳',
      '清洁',
      '再生'
    ],
    objects: {
      physical_collections: [
        '树叶堆',
        '水滴',
        '风力发电机',
        '太阳能板',
        '回收符号',
        '电池',
        '油桶',
        '煤炭',
        '天然气罐',
        '电力塔',
        '生态球',
        '净化器'
      ],
      construction_progress: [
        '环保大厦',
        '能源塔',
        '生态框架',
        '绿色中心',
        '可持续结构'
      ],
      density_distribution: [
        '能源点',
        '污染颗粒',
        '资源节点',
        '生态单元',
        '碳粒子'
      ]
    },
    color_scheme: {
      warm: ['橙色', '红色', '褐色', '土色'], // 暖色调 - 代表污染/警告
      cool: ['绿色', '蓝色', '青色', '冷色'] // 冷色调 - 代表环保/清洁
    }
  },

  // 通用/默认行业
  general: {
    keywords: [],
    objects: {
      physical_collections: [
        '物品堆',
        '物体群',
        '元素集合',
        '实物堆',
        '项目群'
      ],
      construction_progress: [
        '建筑结构',
        '构造框架',
        '建造物',
        '工程体',
        '架构'
      ],
      density_distribution: [
        '元素点',
        '颗粒群',
        '分布节点',
        '空间单元',
        '密度体'
      ]
    },
    color_scheme: {
      warm: ['橙色', '黄色', '红色', '暖色'],
      cool: ['蓝色', '青色', '紫色', '冷色']
    }
  }
}

// 智能行业识别函数
export function detectIndustryFromData(dataAnalysis: DataAnalysisResult): {
  industry: string
  confidence: number
  matchedKeywords: string[]
  explanation: string
} {
  const {
    summary = '',
    table_understanding,
    comparisonItems = [],
    trends = []
  } = dataAnalysis

  // 构建搜索文本
  let searchText = ''

  // 优先使用表格理解结果
  if (table_understanding?.content_summary) {
    searchText += table_understanding.content_summary + ' '
  }
  if (table_understanding?.industry_domain) {
    searchText += table_understanding.industry_domain + ' '
  }

  // 添加其他文本内容
  searchText +=
    summary + ' ' + comparisonItems.join(' ') + ' ' + trends.join(' ')

  // 计算每个行业的匹配分数
  const industryScores: Record<string, { score: number; keywords: string[] }> =
    {}

  Object.entries(INDUSTRY_SEMANTIC_DATABASE).forEach(([industry, data]) => {
    if (industry === 'general') return // 跳过通用类型

    let score = 0
    const matchedKeywords: string[] = []

    data.keywords.forEach((keyword) => {
      const regex = new RegExp(keyword, 'gi')
      const matches = searchText.match(regex)
      if (matches) {
        score += matches.length * 2 // 匹配次数加权
        matchedKeywords.push(keyword)
      }
    })

    // 额外加分：如果表格理解中的行业领域直接匹配
    if (table_understanding?.industry_domain) {
      const domain = table_understanding.industry_domain.toLowerCase()
      if (domain.includes(industry.split('_')[0])) {
        score += 5
      }
    }

    if (score > 0) {
      industryScores[industry] = { score, keywords: matchedKeywords }
    }
  })

  // 找到得分最高的行业
  let bestIndustry = 'general'
  let highestScore = 0
  let bestMatchedKeywords: string[] = []

  Object.entries(industryScores).forEach(([industry, { score, keywords }]) => {
    if (score > highestScore) {
      highestScore = score
      bestIndustry = industry
      bestMatchedKeywords = keywords
    }
  })

  // 计算置信度 (0-100%)
  const confidence = Math.min(100, (highestScore / 10) * 100)

  // 生成解释
  let explanation = ''
  if (bestIndustry !== 'general') {
    const industryName = bestIndustry
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    explanation = `识别为${industryName}行业（置信度：${confidence.toFixed(
      0
    )}%）`
    if (bestMatchedKeywords.length > 0) {
      explanation += `，匹配关键词：${bestMatchedKeywords
        .slice(0, 5)
        .join('、')}`
    }
  } else {
    explanation = '未能明确识别行业，使用通用喻体'
  }

  return {
    industry: bestIndustry,
    confidence,
    matchedKeywords: bestMatchedKeywords,
    explanation
  }
}

// 根据行业和隐喻类型选择喻体

// 修改函数参数类型
export function selectMetaphorObjects(
  industry: string,
  metaphorVisualType: string,
  dataFeatures?: DataFeatures
): {
  primaryObject: string
  alternativeObjects: string[]
  colorScheme: { warm: string[]; cool: string[] }
  description: string
} {
  const industryData =
    INDUSTRY_SEMANTIC_DATABASE[
      industry as keyof typeof INDUSTRY_SEMANTIC_DATABASE
    ] || INDUSTRY_SEMANTIC_DATABASE.general

  // 获取该隐喻类型的物体列表
  const objects =
    industryData.objects[
      metaphorVisualType as keyof typeof industryData.objects
    ] || industryData.objects.physical_collections

  // 智能选择主要物体（基于数据特征）
  let selectedIndex = 0
  if (dataFeatures) {
    // 根据数据特征选择物体
    const sizeRatio = dataFeatures.size_ratio || 1
    const volatility = dataFeatures.volatility_ratio || 1

    if (sizeRatio > 2) {
      // 大小差异大，选择能体现明显差异的物体
      selectedIndex = Math.min(0, objects.length - 1)
    } else if (volatility > 1.5) {
      // 波动性大，选择动态感强的物体
      selectedIndex = Math.min(1, objects.length - 1)
    } else if (objects.length > 3) {
      // 随机选择，增加多样性
      selectedIndex = Math.floor(Math.random() * Math.min(3, objects.length))
    }
  }

  // 获取替代物体
  const alternativeObjects = objects
    .filter((_, index) => index !== selectedIndex)
    .slice(0, 3)

  return {
    primaryObject: objects[selectedIndex],
    alternativeObjects,
    colorScheme: industryData.color_scheme,
    description: `基于${industry.replace('_', '/')}行业特征，选择${
      objects[selectedIndex]
    }作为喻体`
  }
}
