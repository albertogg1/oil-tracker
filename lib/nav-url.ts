export function openNavigation(lat: number, lng: number) {
  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const isAndroid = /Android/i.test(ua)

  let url: string
  if (isIOS) {
    url = `maps://maps.apple.com/?daddr=${lat},${lng}`
  } else if (isAndroid) {
    url = `geo:${lat},${lng}?q=${lat},${lng}`
  } else {
    url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  }

  window.open(url, '_blank')
}
