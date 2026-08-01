export function getPlayerImageUrls(player:any): string[] {
  const urls:string[] = []
  if (!player) return urls
  if (player.image_data) {
    if (player.image_data.primary) urls.push(player.image_data.primary)
    if (player.image_data.fallback) urls.push(player.image_data.fallback)
    if (player.image_data.emergency) urls.push(player.image_data.emergency)
  }
  if (player.image_url) urls.push(player.image_url)
  return urls
}

export function prefetchImage(url:string){
  try {
    const i = new Image()
    i.src = url
  } catch(e){
    // ignore
  }
}
