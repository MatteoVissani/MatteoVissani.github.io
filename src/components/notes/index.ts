import type { DemoNote } from './types'
import { lif } from './lif'
import { wilsonCowan } from './wilson-cowan'
import { kuramoto } from './kuramoto'
import { spikePhase } from './spike-phase'
import { decoding } from './decoding'
import { information } from './information'
import { fourier } from './fourier'
import { filter } from './filter'
import { wavelet } from './wavelet'
import { kalman } from './kalman'
import { spectralParameterization } from './spectral-parameterization'
import { dbs } from './dbs'
import { eeg } from './eeg'
import { spcToolkit } from './spc-toolkit'
import { control } from './control'
import { stateSpace } from './state-space'
import { subspaces } from './subspaces'

// keyed by the slug passed to <DemoNotes demo="…" />
export const notes: Record<string, DemoNote> = {
  lif,
  'wilson-cowan': wilsonCowan,
  kuramoto,
  'spike-phase': spikePhase,
  decoding,
  information,
  fourier,
  filter,
  wavelet,
  kalman,
  'spectral-parameterization': spectralParameterization,
  dbs,
  eeg,
  'spc-toolkit': spcToolkit,
  control,
  'state-space': stateSpace,
  subspaces,
}
