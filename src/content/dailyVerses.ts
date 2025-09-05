interface DailyVerse {
  reference: string;
  text: string;
}

const verses: DailyVerse[] = [
  { reference: "João 3:16", text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna." },
  { reference: "Filipenses 4:13", text: "Tudo posso naquele que me fortalece." },
  { reference: "Romanos 8:28", text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito." },
  { reference: "Jeremias 29:11", text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais." },
  { reference: "Salmos 23:1", text: "O Senhor é o meu pastor; nada me faltará." },
  { reference: "Provérbios 3:5-6", text: "Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas." },
  { reference: "Isaías 41:10", text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça." },
];

// Função simples para obter um versículo com base no dia do ano
export const getVerseOfTheDay = (): DailyVerse => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  const verseIndex = dayOfYear % verses.length;
  return verses[verseIndex];
};