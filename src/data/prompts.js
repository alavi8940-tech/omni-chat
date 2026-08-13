export const builtInPrompts = [
  {
    id: 'write-better',
    category: 'Writing',
    title: 'Rewrite with clarity',
    description: 'Make writing clearer, tighter, and more natural.',
    prompt: 'Rewrite the following text for clarity, flow, and precision. Preserve its meaning and tone. Return only the improved version:\n\n',
  },
  {
    id: 'summarize',
    category: 'Productivity',
    title: 'Executive summary',
    description: 'Extract decisions, risks, and next actions.',
    prompt: 'Create a concise executive summary of the following. Include key points, decisions, risks, and action items:\n\n',
  },
  {
    id: 'translate-fa',
    category: 'Language',
    title: 'Translate to Persian',
    description: 'Natural professional Persian translation.',
    prompt: 'Translate the following into natural, professional Persian. Preserve formatting and technical terms where appropriate:\n\n',
  },
  {
    id: 'translate-en',
    category: 'Language',
    title: 'Translate to English',
    description: 'Fluent idiomatic English translation.',
    prompt: 'Translate the following into fluent, idiomatic English. Preserve formatting and intent:\n\n',
  },
  {
    id: 'debug-code',
    category: 'Development',
    title: 'Debug code',
    description: 'Find the root cause and propose a safe fix.',
    prompt: 'Analyze this code and error. Identify the root cause, explain it briefly, then provide a corrected implementation and relevant tests:\n\n',
  },
  {
    id: 'review-code',
    category: 'Development',
    title: 'Review code',
    description: 'Review correctness, security, and maintainability.',
    prompt: 'Review the following code for correctness, security, performance, accessibility, and maintainability. Rank findings by severity and suggest concrete fixes:\n\n',
  },
  {
    id: 'image-cinematic',
    category: 'Image',
    title: 'Cinematic image',
    description: 'A structured cinematic visual prompt.',
    prompt: 'Create a cinematic image of [SUBJECT], with [LIGHTING], [CAMERA/LENS], [COMPOSITION], [COLOR PALETTE], highly detailed, natural textures, no text, no watermark.',
  },
  {
    id: 'product-photo',
    category: 'Image',
    title: 'Product photography',
    description: 'Premium studio product scene.',
    prompt: 'Premium commercial product photograph of [PRODUCT], seamless dark studio, controlled rim lighting, realistic materials, crisp focus, subtle reflections, luxury advertising composition, no text.',
  },
  {
    id: 'video-shot',
    category: 'Video',
    title: 'Cinematic video shot',
    description: 'Camera movement and timing for video models.',
    prompt: 'A [DURATION]-second cinematic shot of [SUBJECT/ACTION]. Camera: [MOVEMENT]. Lighting: [LIGHTING]. Mood: [MOOD]. Realistic motion, coherent anatomy, consistent subject, no cuts, no text.',
  },
  {
    id: 'study-plan',
    category: 'Learning',
    title: 'Learning roadmap',
    description: 'Build a focused, measurable study plan.',
    prompt: 'Create a practical learning roadmap for [TOPIC] at [LEVEL]. Include milestones, weekly exercises, one portfolio project, common mistakes, and measurable success criteria.',
  },
]

export const promptCategories = ['All', ...new Set(builtInPrompts.map((item) => item.category))]
