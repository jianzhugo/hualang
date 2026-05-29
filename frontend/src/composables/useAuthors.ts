import avatarXinxin from '../assets/TX-X.jpg'
import avatarSongbao from '../assets/TX-S.jpg'

export interface Author {
  name: string
  pinyin: string
  avatar: string
  subtitle: string
  subtitlePinyin: string
  bio?: string
}

const AUTHOR_LIST: Author[] = [
  {
    name: '馨馨',
    pinyin: 'XIN XIN',
    avatar: avatarXinxin,
    subtitle: '近期佳作',
    subtitlePinyin: 'JIN QI JIA ZUO',
    bio: '美丽健康小姐姐'
  },
  {
    name: '松宝',
    pinyin: 'SONG BAO',
    avatar: avatarSongbao,
    subtitle: '近期佳作',
    subtitlePinyin: 'JIN QI JIA ZUO',
    bio: '聪明勇敢小可爱'
  }
]

const authorMap = new Map(AUTHOR_LIST.map((a) => [a.name, a]))

export function getAuthor(name: string): Author | undefined {
  return authorMap.get(name)
}

export function getAllAuthors(): Author[] {
  return AUTHOR_LIST
}

export function getAuthorAvatar(name: string): string {
  return authorMap.get(name)?.avatar || ''
}

export function getAuthorNames(): string[] {
  return AUTHOR_LIST.map((a) => a.name)
}
