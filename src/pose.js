// MediaPipe Pose Landmarker landmark indices: nose=0, ears=7/8, shoulders=11/12,
// elbows=13/14, wrists=15/16, hips=23/24. Rules are deliberately conservative.
const visible = (p) => !!p && (p.visibility == null || p.visibility > .48)
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y)
export function identifyPose(lm) {
  if (!lm || ![11,12,13,14,15,16].every(i=>visible(lm[i]))) return null
  const [ls,rs,le,re,lw,rw] = [11,12,13,14,15,16].map(i=>lm[i])
  const shoulderWidth = Math.max(.08,distance(ls,rs))
  const shoulderY = (ls.y + rs.y)/2
  const wristsUp = lw.y < ls.y - .12 && rw.y < rs.y - .12
  const elbowsUp = le.y < ls.y + .14 && re.y < rs.y + .14
  // Both arms overhead, elbow and wrist can be slightly bent.
  const head = lm[0]
  if (wristsUp && elbowsUp && visible(head) && lw.y < head.y - .06 && rw.y < head.y - .06) return 'up'
  if (wristsUp && le.y > ls.y && re.y > rs.y) return 'open'
  if (visible(head) && ((lw.y < head.y - .12 && rw.y > rs.y + .13) || (rw.y < head.y - .12 && lw.y > ls.y + .13))) return 'wave'
  // Hands toward opposite shoulders/chest and elbows not down at the waist.
  const leftAcross = distance(lw,rs) < shoulderWidth * .83
  const rightAcross = distance(rw,ls) < shoulderWidth * .83
  const chestLevel = lw.y > shoulderY - .19 && rw.y > shoulderY - .19 && lw.y < shoulderY + .3 && rw.y < shoulderY + .3
  if (leftAcross && rightAcross && chestLevel) return 'cross'
  const ears = [lm[7],lm[8]].filter(visible)
  const handNearHead = (w) => [head,...ears].some(p=>visible(p) && distance(w,p) < shoulderWidth * .75)
  // One hand at temple, other arm down; avoids classifying overhead as salute.
  const leftSalute = handNearHead(lw) && rw.y > rs.y + .13 && le.y < ls.y + .25
  const rightSalute = handNearHead(rw) && lw.y > ls.y + .13 && re.y < rs.y + .25
  if (leftSalute || rightSalute) return 'salute'
  return null
}
export const SKELETON = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24]]
