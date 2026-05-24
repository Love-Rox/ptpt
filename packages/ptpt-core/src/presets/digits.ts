import type { PresetDefinition } from './_types'

export const digitsPreset: PresetDefinition = {
  name: 'digits',
  chars: ' 0123456789',
  description: 'ブランク + 数字 0-9。カウンタ・時計・桁分割表示向け。全11フラップ。',
  recommendedDuration: 200,
}
