import { HeadshotStyle, Scene, PortraitStyle, InspirationCategory } from './types';

export const HEADSHOT_STYLES: HeadshotStyle[] = [
  {
    id: 'corporate_grey',
    name: 'Doanh nghiệp',
    prompt: 'The person should be dressed in professional business attire, with a confident and competent expression suitable for a corporate environment.',
    backgroundDescription: 'a clean, solid light grey backdrop',
    thumbnail: 'https://picsum.photos/seed/corporate/200'
  },
  {
    id: 'modern_tech',
    name: 'Văn phòng Hiện đại',
    prompt: 'The person should have a friendly yet confident expression, dressed in smart-casual or business-casual attire suitable for a modern tech company.',
    backgroundDescription: 'a modern tech office with large windows',
    thumbnail: 'https://picsum.photos/seed/tech/200'
  },
  {
    id: 'outdoor_natural',
    name: 'Ngoài trời Tự nhiên',
    prompt: 'The person should have a warm and approachable expression, dressed in comfortable yet professional clothing.',
    backgroundDescription: 'an outdoor setting with natural foliage or a subtle urban park scene',
    thumbnail: 'https://picsum.photos/seed/outdoor/200'
  },
  {
    id: 'black_white',
    name: 'Cổ điển Đen trắng',
    prompt: 'A classic, dramatic black and white professional headshot. The focus should be on the person\'s expression and character, conveying a sense of timelessness and sophistication.',
    backgroundDescription: 'a dark, plain background',
    thumbnail: 'https://picsum.photos/seed/bw/200'
  },
  {
    id: 'creative_studio',
    name: 'Studio Sáng tạo',
    prompt: 'The person\'s attire should be smart-casual, reflecting a creative professional with a unique and artistic flair.',
    backgroundDescription: 'a colorful, textured studio backdrop',
    thumbnail: 'https://picsum.photos/seed/creative/200'
  },
  {
    id: 'academic',
    name: 'Học thuật',
    prompt: 'The person should appear thoughtful and knowledgeable, dressed in academic or business-casual attire.',
    backgroundDescription: 'a university or library setting',
    thumbnail: 'https://picsum.photos/seed/academic/200'
  }
];

export const PRESET_SCENES: Scene[] = [
  {
    id: 'conference_stage',
    name: 'Sân khấu Hội nghị',
    thumbnail: 'https://picsum.photos/seed/conference/200',
  },
  {
    id: 'modern_library',
    name: 'Thư viện Hiện đại',
    thumbnail: 'https://picsum.photos/seed/library/200',
  },
  {
    id: 'mountain_peak',
    name: 'Đỉnh núi',
    thumbnail: 'https://picsum.photos/seed/mountain/200',
  },
    {
    id: 'cityscape_rooftop',
    name: 'Sân thượng Thành phố',
    thumbnail: 'https://picsum.photos/seed/rooftop/200',
  },
    {
    id: 'cozy_cafe',
    name: 'Quán cà phê',
    thumbnail: 'https://picsum.photos/seed/cafe/200',
  },
    {
    id: 'art_gallery',
    name: 'Triển lãm Nghệ thuật',
    thumbnail: 'https://picsum.photos/seed/gallery/200',
  }
];

export const PORTRAIT_STYLES: PortraitStyle[] = [
    {
        id: 'anime',
        name: 'Anime',
        prompt: 'Transform the portrait into a vibrant, high-quality Japanese anime style. Emphasize large, expressive eyes and clean lines.',
        thumbnail: 'https://picsum.photos/seed/anime/200',
    },
    {
        id: 'oil_painting',
        name: 'Sơn dầu',
        prompt: 'Convert the photo into a classic oil painting with visible brushstrokes and a rich, textured feel.',
        thumbnail: 'https://picsum.photos/seed/oilpaint/200',
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        prompt: 'Reimagine the person in a futuristic cyberpunk style, with neon lighting, high-tech elements, and a gritty, urban aesthetic.',
        thumbnail: 'https://picsum.photos/seed/cyberpunk/200',
    },
    {
        id: 'sketch',
        name: 'Phác thảo',
        prompt: 'Redraw the portrait as a detailed pencil sketch on textured paper, focusing on shading and contour lines.',
        thumbnail: 'https://picsum.photos/seed/sketch/200',
    },
    {
        id: 'manga',
        name: 'Manga',
        prompt: 'Turn the portrait into a black and white manga panel style, using screentones and dynamic action lines.',
        thumbnail: 'https://picsum.photos/seed/manga/200',
    },
    {
        id: 'pop_art',
        name: 'Pop Art',
        prompt: 'Recreate the portrait in the style of Andy Warhol\'s pop art, using bold, contrasting colors and a silkscreen effect.',
        thumbnail: 'https://picsum.photos/seed/popart/200',
    },
];

export const INSPIRATION_CATEGORIES: InspirationCategory[] = [
  {
    id: 'fantasy_characters',
    name: 'Nhân vật Fantasy',
    prompts: [
      'A full body portrait of a wise old elf wizard with a long white beard, holding a glowing staff, in an enchanted forest, hyper-realistic, fantasy art.',
      'A fierce female orc warrior with tribal tattoos and a heavy battle axe, standing on a rocky outcrop at sunset, cinematic lighting, detailed armor.',
      'A nimble halfling rogue dressed in dark leather, perched on a rooftop overlooking a medieval city at night, volumetric fog, digital painting.',
      'A majestic dragonborn paladin in shining platinum armor, wielding a holy sword that radiates light, epic character concept art.',
      'A mysterious tiefling warlock with glowing purple eyes and small horns, casting a dark magic spell in a forgotten library, atmosphere.',
      'A dwarf blacksmith with a braided beard, forging a legendary sword in a volcanic forge, sparks flying, high contrast.',
      'A graceful wood elf archer with intricate tattoos, drawing her bow in a sun-dappled ancient forest, golden hour lighting.',
      'A powerful human sorceress levitating, with crackling lightning surrounding her hands, stormy background, dramatic.',
    ],
  },
  {
    id: 'surreal_landscapes',
    name: 'Phong cảnh Siêu thực',
    prompts: [
      'A vast desert with floating islands connected by glowing bridges, under a sky with two moons, surreal landscape, matte painting.',
      'An ocean made of liquid crystal, with geometric sea creatures swimming below, bioluminescent, abstract.',
      'A forest where the trees are made of glass and the leaves are shimmering butterflies, ethereal, magical.',
      'A city skyline where the buildings are giant, overgrown chess pieces, black and white with a single red balloon, surrealism.',
      'A cascading waterfall of pure starlight, flowing into a nebula river, cosmic, awe-inspiring.',
      'A mountain range that is actually a sleeping giant, covered in moss and trees, epic scale.',
      'A field of giant, glowing mushrooms under a starry night sky, fantasy, magical atmosphere.',
      'Stairs leading up into the clouds, with doorways to other dimensions floating around, dreamlike.',
    ],
  },
    {
    id: 'futuristic_architecture',
    name: 'Kiến trúc Tương lai',
    prompts: [
      'A futuristic eco-city with buildings covered in lush vertical gardens and waterfalls, clean energy, utopian, solarpunk aesthetic.',
      'A massive arcology skyscraper that pierces the clouds, with flying vehicles and sky-bridges, cyberpunk, megastructure.',
      'An underwater research facility with transparent domes, looking out at deep-sea life and volcanic vents, sci-fi concept art.',
      'A sleek, minimalist Martian colony with interconnected biodomes under the red sky of Mars, hard science fiction.',
      'A towering skyscraper made of bioluminescent crystal, with flying vehicles zipping between its spires, hyper-realistic, 8k.',
      'A city built into the side of a giant canyon, with buildings carved directly from the rock, blending nature and technology.',
      'A gravity-defying city that floats among the clouds, with elegant, curved architecture and shimmering energy shields.',
      'A bustling spaceport on a distant moon, with various alien ships landing and taking off, detailed, cinematic.',
    ],
  },
  {
    id: 'abstract_art',
    name: 'Nghệ thuật Trừu tượng',
    prompts: [
      'An explosion of vibrant colors, swirling together in a fluid, dynamic composition, abstract expressionism.',
      'A complex network of geometric shapes and lines, creating a sense of digital depth and structure, minimalist, vector art.',
      'A serene composition of soft pastel color fields, blending gently into one another, calming and meditative.',
      'A chaotic and energetic splash of black ink on a white background, evoking a sense of raw emotion, calligraphy style.',
      'A textured abstract piece that looks like rusted metal and peeling paint, industrial, grunge aesthetic.',
      'A fractal pattern of iridescent, crystalline structures, infinitely complex and mesmerizing.',
      'A digital glitch art piece with distorted pixels, RGB shifts, and scan lines, vaporwave aesthetic.',
      'An abstract representation of sound waves, visualized as flowing ribbons of light.',
    ],
  },
];