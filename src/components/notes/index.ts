import type { DemoNote } from './types'
import { lif } from './lif'
import { wilsonCowan } from './wilson-cowan'
import { spikePhase } from './spike-phase'
import { decoding } from './decoding'
import { information } from './information'
import { fourier } from './fourier'
import { filter } from './filter'
import { wavelet } from './wavelet'
import { kalman } from './kalman'
import { dbs } from './dbs'
import { eeg } from './eeg'
import { spcToolkit } from './spc-toolkit'

// keyed by the slug passed to <DemoNotes demo="…" />
export const notes: Record<string, DemoNote> = {
  lif,
  'wilson-cowan': wilsonCowan,
  'spike-phase': spikePhase,
  decoding,
  information,
  fourier,
  filter,
  wavelet,
  kalman,
  dbs,
  eeg,
  'spc-toolkit': spcToolkit,
}
