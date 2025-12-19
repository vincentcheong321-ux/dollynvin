
export interface MetroStation {
  name: string;
  id: string;
  urlName: string;
}

export interface MetroLine {
  name: string;
  id: string;
  color: string;
  stations: MetroStation[];
}

export const metroLines: MetroLine[] = [
  {
    name: 'Ginza Line',
    id: 'G',
    color: '#ff9500',
    stations: [
      { name: 'Shibuya', id: 'G01', urlName: 'shibuya' },
      { name: 'Omote-sando', id: 'G02', urlName: 'omote-sando' },
      { name: 'Gaien-mae', id: 'G03', urlName: 'gaien-mae' },
      { name: 'Aoyama-itchome', id: 'G04', urlName: 'aoyama-itchome' },
      { name: 'Akasaka-mitsuke', id: 'G05', urlName: 'akasaka-mitsuke' },
      { name: 'Tameike-sanno', id: 'G06', urlName: 'tameike-sanno' },
      { name: 'Toranomon', id: 'G07', urlName: 'toranomon' },
      { name: 'Shimbashi', id: 'G08', urlName: 'shimbashi' },
      { name: 'Ginza', id: 'G09', urlName: 'ginza' },
      { name: 'Kyobashi', id: 'G10', urlName: 'kyobashi' },
      { name: 'Nihombashi', id: 'G11', urlName: 'nihombashi' },
      { name: 'Mitsukoshimae', id: 'G12', urlName: 'mitsukoshimae' },
      { name: 'Kanda', id: 'G13', urlName: 'kanda' },
      { name: 'Suehirocho', id: 'G14', urlName: 'suehirocho' },
      { name: 'Ueno-hirokoji', id: 'G15', urlName: 'ueno-hirokoji' },
      { name: 'Ueno', id: 'G16', urlName: 'ueno' },
      { name: 'Inaricho', id: 'G17', urlName: 'inaricho' },
      { name: 'Tawaramachi', id: 'G18', urlName: 'tawaramachi' },
      { name: 'Asakusa', id: 'G19', urlName: 'asakusa' }
    ]
  },
  {
    name: 'Marunouchi Line',
    id: 'M',
    color: '#f32b2b',
    stations: [
      { name: 'Ogikubo', id: 'M01', urlName: 'ogikubo' },
      { name: 'Shinjuku', id: 'M08', urlName: 'shinjuku' },
      { name: 'Shinjuku-sanchome', id: 'M09', urlName: 'shinjuku-sanchome' },
      { name: 'Yotsuya', id: 'M12', urlName: 'yotsuya' },
      { name: 'Akasaka-mitsuke', id: 'M13', urlName: 'akasaka-mitsuke' },
      { name: 'Ginza', id: 'M16', urlName: 'ginza' },
      { name: 'Tokyo', id: 'M17', urlName: 'tokyo' },
      { name: 'Otemachi', id: 'M18', urlName: 'otemachi' },
      { name: 'Ikebukuro', id: 'M25', urlName: 'ikebukuro' }
    ]
  },
  {
    name: 'Hibiya Line',
    id: 'H',
    color: '#b5b5b5',
    stations: [
      { name: 'Naka-meguro', id: 'H01', urlName: 'naka-meguro' },
      { name: 'Ebisu', id: 'H02', urlName: 'ebisu' },
      { name: 'Roppongi', id: 'H04', urlName: 'roppongi' },
      { name: 'Ginza', id: 'H09', urlName: 'ginza' },
      { name: 'Akihabara', id: 'H16', urlName: 'akihabara' },
      { name: 'Ueno', id: 'H18', urlName: 'ueno' },
      { name: 'Kita-senju', id: 'H22', urlName: 'kita-senju' }
    ]
  },
  {
    name: 'Tozai Line',
    id: 'T',
    color: '#009bbf',
    stations: [
      { name: 'Nakano', id: 'T01', urlName: 'nakano' },
      { name: 'Takadanobaba', id: 'T03', urlName: 'takadanobaba' },
      { name: 'Iidabashi', id: 'T06', urlName: 'iidabashi' },
      { name: 'Otemachi', id: 'T09', urlName: 'otemachi' },
      { name: 'Nihombashi', id: 'T10', urlName: 'nihombashi' }
    ]
  },
  {
    name: 'Chiyoda Line',
    id: 'C',
    color: '#00bb85',
    stations: [
      { name: 'Yoyogi-uehara', id: 'C01', urlName: 'yoyogi-uehara' },
      { name: 'Meiji-jingumae', id: 'C03', urlName: 'meiji-jingumae' },
      { name: 'Omote-sando', id: 'C04', urlName: 'omote-sando' },
      { name: 'Otemachi', id: 'C11', urlName: 'otemachi' }
    ]
  },
  {
    name: 'Yurakucho Line',
    id: 'Y',
    color: '#c1a470',
    stations: [
      { name: 'Ikebukuro', id: 'Y09', urlName: 'ikebukuro' },
      { name: 'Iidabashi', id: 'Y13', urlName: 'iidabashi' },
      { name: 'Yurakucho', id: 'Y18', urlName: 'yurakucho' },
      { name: 'Toyosu', id: 'Y22', urlName: 'toyosu' }
    ]
  },
  {
    name: 'Hanzomon Line',
    id: 'Z',
    color: '#8f76d6',
    stations: [
      { name: 'Shibuya', id: 'Z01', urlName: 'shibuya' },
      { name: 'Omote-sando', id: 'Z02', urlName: 'omote-sando' },
      { name: 'Nagatacho', id: 'Z04', urlName: 'nagatacho' },
      { name: 'Otemachi', id: 'Z08', urlName: 'otemachi' },
      { name: 'Oshiage', id: 'Z14', urlName: 'oshiage' }
    ]
  },
  {
    name: 'Namboku Line',
    id: 'N',
    color: '#00ac9b',
    stations: [
      { name: 'Meguro', id: 'N01', urlName: 'meguro' },
      { name: 'Iidabashi', id: 'N10', urlName: 'iidabashi' },
      { name: 'Akabane-iwabuchi', id: 'N19', urlName: 'akabane-iwabuchi' }
    ]
  },
  {
    name: 'Fukutoshin Line',
    id: 'F',
    color: '#9c5e31',
    stations: [
      { name: 'Ikebukuro', id: 'F09', urlName: 'ikebukuro' },
      { name: 'Shinjuku-sanchome', id: 'F13', urlName: 'shinjuku-sanchome' },
      { name: 'Meiji-jingumae', id: 'F15', urlName: 'meiji-jingumae' },
      { name: 'Shibuya', id: 'F16', urlName: 'shibuya' }
    ]
  }
];
