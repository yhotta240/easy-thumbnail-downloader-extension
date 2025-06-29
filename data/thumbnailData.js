
export const thumbnailData = {
  "www.youtube.com": {
    baseUrl: "https://i.ytimg.com/vi/",
    sizes: {
      default: { name: "default", width: 120, height: 90, size: 1 },
      default_1: { name: "1", width: 120, height: 90, size: 1.1 },
      default_2: { name: "2", width: 120, height: 90, size: 1.2 },
      default_3: { name: "3", width: 120, height: 90, size: 1.3 },
      mqdefault: {
        name: "mqdefault",
        width: 120,
        height: 90,
        size: 2
      },
      hq720: { name: "hq720", width: 120, height: 90, size: 3 },
      maxresdefault: {
        name: "maxresdefault",
        width: 120,
        height: 90,
        size: 3
      }
    }
  },
  "note.com":{
    baseUrl: "https://assets.st-note.com/",
    getIdFuncName: "getNoteId",
    sizes: {
      120: { name: "120", width: 120, height: 90, size: 1 },
      240: { name: "240", width: 240, height: 180, size: 2 },
      480: { name: "480", width: 480, height: 360, size: 3 },
      1280: { name: "1280", width: 1280, height: 720, size: 4 },
      1920: { name: "1920", width: 1920, height: 1080, size: 5 },
    }
  }
}
