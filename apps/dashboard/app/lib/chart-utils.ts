// Helper functions for chart data generation and manipulation

export function generateRandomValues(min: number, max: number, count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min)
}

export function getColorPalette(count: number): string[] {
  // Minimal color palette using CSS custom properties and neutral tones
  const baseColors = [
    "hsl(var(--chart-1))", // Primary chart color
    "hsl(var(--chart-2))", // Secondary chart color  
    "hsl(var(--chart-3))", // Tertiary chart color
    "hsl(var(--chart-4))", // Quaternary chart color
    "hsl(var(--chart-5))", // Quinary chart color
    "hsl(220, 13%, 91%)",  // Light gray
    "hsl(215, 16%, 47%)",  // Medium gray
    "hsl(220, 9%, 46%)",   // Dark gray
    "hsl(0, 0%, 64%)",     // Neutral gray
  ]

  // If we need more colors than we have in our base palette, we'll repeat them
  if (count <= baseColors.length) {
    return baseColors.slice(0, count)
  }

  // Otherwise, repeat the palette
  const result = []
  for (let i = 0; i < count; i++) {
    result.push(baseColors[i % baseColors.length])
  }

  return result
}

// Get minimal color palette with opacity variants
export function getMinimalColorPalette(count: number, opacity: number = 1): string[] {
  const colors = getColorPalette(count)
  return colors.map(color => {
    if (color.startsWith('hsl(')) {
      // Convert hsl to rgba for opacity support
      const hslMatch = color.match(/hsl\(([^)]+)\)/)
      if (hslMatch) {
        const [h, s, l] = hslMatch[1].split(',').map(v => parseFloat(v))
        // Convert HSL to RGB (simplified conversion)
        const hue = h / 360
        const sat = s / 100
        const light = l / 100
        
        const c = (1 - Math.abs(2 * light - 1)) * sat
        const x = c * (1 - Math.abs((hue * 6) % 2 - 1))
        const m = light - c / 2
        
        let r, g, b
        if (hue < 1/6) {
          [r, g, b] = [c, x, 0]
        } else if (hue < 2/6) {
          [r, g, b] = [x, c, 0]
        } else if (hue < 3/6) {
          [r, g, b] = [0, c, x]
        } else if (hue < 4/6) {
          [r, g, b] = [0, x, c]
        } else if (hue < 5/6) {
          [r, g, b] = [x, 0, c]
        } else {
          [r, g, b] = [c, 0, x]
        }
        
        return `rgba(${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)}, ${opacity})`
      }
    }
    return color
  })
}

// Get specific minimal colors for different chart types
export const minimalColors = {
  primary: "hsl(var(--chart-1))",
  secondary: "hsl(var(--chart-2))", 
  tertiary: "hsl(var(--chart-3))",
  quaternary: "hsl(var(--chart-4))",
  quinary: "hsl(var(--chart-5))",
  gray: "hsl(220, 13%, 91%)",
  muted: "hsl(215, 16%, 47%)",
  neutral: "hsl(0, 0%, 64%)",
  // Background colors with low opacity
  primaryBg: "hsl(var(--chart-1) / 0.1)",
  secondaryBg: "hsl(var(--chart-2) / 0.1)",
  tertiaryBg: "hsl(var(--chart-3) / 0.1)",
  quaternaryBg: "hsl(var(--chart-4) / 0.1)",
  quinaryBg: "hsl(var(--chart-5) / 0.1)",
}
