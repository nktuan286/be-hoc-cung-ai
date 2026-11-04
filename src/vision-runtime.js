import { FilesetResolver } from '@mediapipe/tasks-vision'
import simdLoader from '@mediapipe/tasks-vision/vision_wasm_internal.js?url&no-inline'
import simdBinary from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url&no-inline'
import fallbackLoader from '@mediapipe/tasks-vision/vision_wasm_nosimd_internal.js?url&no-inline'
import fallbackBinary from '@mediapipe/tasks-vision/vision_wasm_nosimd_internal.wasm?url&no-inline'

// Ship the runtime from the same package as the JS API, including non-SIMD support.
export async function resolveVisionRuntime() {
  return await FilesetResolver.isSimdSupported()
    ? { wasmLoaderPath: simdLoader, wasmBinaryPath: simdBinary }
    : { wasmLoaderPath: fallbackLoader, wasmBinaryPath: fallbackBinary }
}
