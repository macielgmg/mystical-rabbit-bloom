// src/content/studyMetadata.ts

interface LocalChapterMetadata {
  id: string;
  chapter_number: number;
  title: string;
}

interface LocalStudyMetadata {
  id: string;
  title: string;
  description: string;
  is_free: boolean;
  imageUrl: string; // Campo para a imagem
  chapters: LocalChapterMetadata[];
}

export const localStudies: LocalStudyMetadata[] = [
  {
    id: '8a1b2c3d-4e5f-4678-9012-34567890abcd', // ID para '150 Salmos Explicados'
    title: '150 Salmos Explicados',
    description: 'Um mergulho nos cânticos de louvor, súplica e sabedoria de Davi.',
    is_free: true,
    imageUrl: '/studies/150salmo.jpg',
    chapters: [
      {
        id: '1a2b3c4d-5e6f-4789-a012-345678901234', // ID para Salmo 1
        chapter_number: 1,
        title: 'Salmo 1: Os Dois Caminhos',
      },
      {
        id: '2a3b4c5d-6e7f-4890-b123-456789012345', // ID para Salmo 2
        chapter_number: 2,
        title: 'Salmo 2: O Rei Ungido',
      },
      {
        id: '3a4b5c6d-7e8f-4901-c234-567890123456', // ID para Salmo 3
        chapter_number: 3,
        title: 'Salmo 3: Confiança em Meio à Adversidade',
      },
      {
        id: '4a5b6c7d-8e9f-4012-d345-678901234567', // ID para Salmo 4
        chapter_number: 4,
        title: 'Salmo 4: Oração Noturna de Confiança',
      },
      {
        id: '5a6b7c8d-9e0f-4123-e456-789012345678', // ID para Salmo 5
        chapter_number: 5,
        title: 'Salmo 5: Oração Matinal por Proteção',
      },
      {
        id: '6a7b8c9d-0e1f-4234-f567-890123456789', // ID para Salmo 6
        chapter_number: 6,
        title: 'Salmo 6: Clamor por Misericórdia e Cura',
      },
      {
        id: '7a8b9c0d-1e2f-4345-a678-901234567890', // ID para Salmo 7
        chapter_number: 7,
        title: 'Salmo 7: Oração por Justiça',
      },
      {
        id: '8a9b0c1d-2e3f-4456-b789-012345678901', // ID para Salmo 8
        chapter_number: 8,
        title: 'Salmo 8: A Glória de Deus e a Dignidade do Homem',
      },
      {
        id: '9a0b1c2d-3e4f-4567-c890-123456789012', // ID para Salmo 9
        chapter_number: 9,
        title: 'Salmo 9: Louvor pela Justiça de Deus',
      },
      {
        id: '0a1b2c3d-4e5f-4678-d901-234567890123', // ID para Salmo 10
        chapter_number: 10,
        title: 'Salmo 10: O Lamento pelo Oprimido',
      },
      {
        id: '1b2c3d4e-5f6a-4789-e012-34567890123b', // NOVO ID para Salmo 11
        chapter_number: 11,
        title: 'Salmo 11: Confiança Inabalável em Deus',
      },
      {
        id: '2c3d4e5f-6a7b-4890-f123-45678901234c', // NOVO ID para Salmo 12
        chapter_number: 12,
        title: 'Salmo 12: Oração Contra a Falsidade',
      },
      {
        id: '3d4e5f6a-7b8c-4901-a234-56789012345d', // NOVO ID para Salmo 13
        chapter_number: 13,
        title: 'Salmo 13: Do Desespero à Confiança',
      },
      {
        id: '4e5f6a7b-8c9d-4012-b345-67890123456e', // NOVO ID para Salmo 14
        chapter_number: 14,
        title: 'Salmo 14: A Loucura da Negação de Deus',
      },
      {
        id: '5f6a7b8c-9d0e-4123-c456-78901234567f', // NOVO ID para Salmo 15
        chapter_number: 15,
        title: 'Salmo 15: O Cidadão do Reino de Deus',
      },
      {
        id: '6a7b8c9d-0e1f-4234-d567-89012345678g', // NOVO ID para Salmo 16
        chapter_number: 16,
        title: 'Salmo 16: O Senhor é Minha Porção',
      },
      {
        id: '7a8b9c0d-1e2f-4345-e678-90123456789h', // NOVO ID para Salmo 17
        chapter_number: 17,
        title: 'Salmo 17: Oração por Proteção e Justiça',
      },
      {
        id: '8a9b0c1d-2e3f-4456-f789-01234567890i', // NOVO ID para Salmo 18
        chapter_number: 18,
        title: 'Salmo 18: Hino de Vitória e Libertação',
      },
      {
        id: '9a0b1c2d-3e4f-4567-a890-12345678901j', // NOVO ID para Salmo 19
        chapter_number: 19,
        title: 'Salmo 19: A Glória de Deus na Criação e na Lei',
      },
      {
        id: '0a1b2c3d-4e5f-4678-b901-23456789012k', // NOVO ID para Salmo 20
        chapter_number: 20,
        title: 'Salmo 20: Oração por Vitória na Batalha',
      },
      // Adicione mais capítulos aqui conforme necessário
    ],
  },
  // --- Novos Estudos ---
  {
    id: 'a1b2c3d4-e5f6-4789-a012-34567890123a', // ID para 'Parábolas de Jesus'
    title: 'Parábolas de Jesus',
    description: 'Descubra os ensinamentos profundos de Jesus através de suas parábolas.',
    is_free: true,
    imageUrl: '/studies/parabolas-jesus.jpg', // Nova imagem: Jesus ensinando
    chapters: [
      {
        id: 'b1c2d3e4-f5a6-4890-b123-45678901234b', // ID para O Semeador
        chapter_number: 1,
        title: 'Capítulo 1: O Semeador',
      },
      {
        id: 'c1d2e3f4-a5b6-4901-c234-56789012345c', // ID para O Filho Pródigo
        chapter_number: 2,
        title: 'Capítulo 2: O Filho Pródigo',
      },
      {
        id: 'd1e2f3a4-b5c6-4012-d345-67890123456d', // ID para O Bom Samaritano
        chapter_number: 3,
        title: 'Capítulo 3: O Bom Samaritano',
      },
      {
        id: '7b8c9d0e-1f2a-4345-b678-901234567890', // NOVO ID para O Tesouro Escondido e a Pérola de Grande Valor
        chapter_number: 4,
        title: 'Capítulo 4: O Tesouro Escondido e a Pérola de Grande Valor',
      },
    ],
  },
  {
    id: 'e1f2a3b4-c5d6-4123-e456-78901234567e', // ID para 'Estudo do Livro de João'
    title: 'Estudo do Livro de João',
    description: 'Uma jornada profunda pelo Evangelho de João, revelando a divindade de Cristo.',
    is_free: false,
    imageUrl: '/studies/apostolo-joao.jpg', // Nova imagem: apóstolo João
    chapters: [
      {
        id: 'f1a2b3c4-d5e6-4234-f567-89012345678f', // ID para O Verbo se Fez Carne
        chapter_number: 1,
        title: 'Capítulo 1: O Verbo se Fez Carne',
      },
      {
        id: 'a1b2c3d4-e5f6-4345-a678-90123456789a', // ID para Nicodemos
        chapter_number: 2,
        title: 'Capítulo 2: Nicodemos e o Novo Nascimento',
      },
      {
        id: 'b1c2d3e4-f5a6-4456-b789-01234567890b', // ID para A Mulher Samaritana
        chapter_number: 3,
        title: 'Capítulo 3: A Mulher Samaritana',
      },
      {
        id: '8c9d0e1f-2a3b-4456-c789-012345678901', // NOVO ID para O Cego de Nascença
        chapter_number: 4,
        title: 'Capítulo 4: O Cego de Nascença',
      },
    ],
  },
  {
    id: 'c1d2e3f4-a5b6-4567-c890-12345678901c', // ID para 'Princípios de Liderança Cristã'
    title: 'Princípios de Liderança Cristã',
    description: 'Explore os fundamentos bíblicos para uma liderança eficaz e inspiradora.',
    is_free: false,
    imageUrl: '/studies/liderancaF.png', // Nova imagem para Liderança Cristã
    chapters: [
      {
        id: 'd1e2f3a4-b5c6-4678-d901-23456789012d', // ID para O Servo Líder
        chapter_number: 1,
        title: 'Capítulo 1: O Servo Líder',
      },
      {
        id: 'e1f2a3b4-c5d6-4789-e012-34567890123e', // ID para Integridade e Caráter
        chapter_number: 2,
        title: 'Capítulo 2: Integridade e Caráter',
      },
      {
        id: 'f1a2b3c4-d5e6-4890-f123-45678901234f', // ID para Visão e Propósito
        chapter_number: 3,
        title: 'Capítulo 3: Visão e Propósito',
      },
      {
        id: '9d0e1f2a-3b4c-4567-d890-123456789012', // NOVO ID para Comunicação Eficaz
        chapter_number: 4,
        title: 'Capítulo 4: Comunicação Eficaz',
      },
    ],
  },
];