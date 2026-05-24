import type { PresetDefinition } from './_types'

export const alphanumericPreset: PresetDefinition = {
  name: 'alphanumeric',
  chars: ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  description: 'ブランク + 英大文字 + 数字。記号を含まないシンプルな英数字セット。全37フラップ。',
  recommendedDuration: 200,
  locale: 'en',
}
