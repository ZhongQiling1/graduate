// 类型定义
export interface GeneratedImage {
  url: string
  description: string
  prompt: string
  rawPrompt?: string // 新增：AI生成的原始提示词
  fallbackPrompt?: string // 新增：备用提示词
  promptTemplate?: string // 新增：原始指令模板
}

// API响应类型定义
export interface TextGenerationResponse {
  content: string
}

export interface ImageGenerationResponse {
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

// 数据特征接口定义
export interface DataCharacteristics {
  sizeComparison?: string
  volatility?: string
  trendDirection?: string
  correlation?: string
  distributionType?: string
  // 添加其他可能的数据特征属性
  [key: string]: string | number | boolean | undefined
}

export interface IndustryAnalysis {
  detected_industry: string
  industry_confidence: number
  main_category: string
  sub_category: string
  suggested_metaphor_objects: {
    [key: string]: {
      primaryObject: string
      colorScheme: {
        warm: string[]
        cool: string[]
      }
      industry: string
      entitySynonyms: {
        entityA: string[]
        entityB: string[]
      }
    }
  }
  entity_keywords?: {
    primary_object: string
    secondary_objects: string[]
    colors: {
      warm: string[]
      cool: string[]
    }
    entityA_synonyms: string[]
    entityB_synonyms: string[]
  }
}

export interface DataAnalysisResult {
  table_understanding?: {
    table_type: string
    industry_domain: string
    business_purpose: string
    content_summary: string
    confidence_score: number
    likely_scenarios: string[]
  }
  table_understanding_explained?: string
  industry_analysis?: IndustryAnalysis
  comparisonItems: string[]
  trends: string[]
  characteristics: DataCharacteristics
  summary: string
  // 新增的数值特征字段（来自第二个接口）
  numerical_features?: {
    size_ratio?: number // 大小比例，如1.8
    volatility_ratio?: number // 波动性比例
    trend_slopes?: {
      entityA?: number
      entityB?: number
    }
    values?: {
      entityA: {
        mean?: number
        max?: number
        min?: number
        current?: number
        label?: string
        unit?: string
      }
      entityB: {
        mean?: number
        max?: number
        min?: number
        current?: number
        label?: string
        unit?: string
      }
    }
    // 添加 percentages 属性
    percentages?: {
      entityA?: number
      entityB?: number
    }
  }
  // 新增双文件模式相关字段（可选）
  analysis_mode?: 'single' | 'dual'
  file_comparison_summary?: {
    similarity_score: number
    comparison_type: string
    key_findings: string[]
    overall_assessment: string
  }
  fileA_analysis?: {
    table_type: string
    industry_domain: string
    content_summary: string
    main_characteristics: string[]
    visual_label?: string // 添加可选的visual_label属性
    data_characteristics?: string
    filename?: string
  }
  fileB_analysis?: {
    table_type: string
    industry_domain: string
    content_summary: string
    main_characteristics: string[]
    visual_label?: string // 添加可选的visual_label属性
    data_characteristics?: string
    filename?: string
  }
  comparison_insights?: {
    numerical_comparison: {
      mean_difference: string
      ratio_analysis: string
      statistical_significance: string
    }
    structural_differences: string[]
    trend_comparison: string
    industry_context_comparison: string
  }
  files_analyzed?: string[]
  timestamp?: string
}
