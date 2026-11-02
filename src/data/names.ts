import type { Region } from './types';

const FIRST: Record<Region, string[]> = {
  'North America': ['Jordan', 'Taylor', 'Morgan', 'Avery', 'Riley', 'Casey', 'Jamie', 'Drew', 'Megan', 'Kevin', 'Laura', 'Brian', 'Ashley', 'Daniel', 'Rachel', 'Marcus', 'Olivia', 'Ethan', 'Grace', 'Noah', 'Hannah', 'Lucas', 'Chloe', 'Owen'],
  'Latin America': ['Bruno', 'Carla', 'Felipe', 'Juliana', 'Camilo', 'Marta', 'Andrés', 'Valeria', 'Mateo', 'Gabriela', 'Thiago', 'Isabela', 'Rodrigo', 'Fernanda', 'Santiago', 'Lucía', 'Pedro', 'Mariana', 'Diego', 'Renata', 'Rafael', 'Larissa'],
  EMEA: ['Lukas', 'Sophie', 'Felix', 'Lena', 'Aoife', 'Ciaran', 'Amelia', 'Oliver', 'Chloé', 'Hugo', 'Elena', 'Pablo', 'Noemi', 'Matteo', 'Freya', 'Jonas', 'Leila', 'Youssef', 'Ingrid', 'Tomás', 'Clara', 'Anouk'],
  APAC: ['Wei', 'Mei', 'Hiroshi', 'Yuki', 'Arjun', 'Priyanka', 'Jun', 'Sakura', 'Ravi', 'Ananya', 'Daniel', 'Grace', 'Kenta', 'Haruka', 'Vikram', 'Li Na', 'Ethan', 'Siew Lin', 'Takumi', 'Nisha', 'Jia Hui', 'Sean'],
};

const LAST: Record<Region, string[]> = {
  'North America': ['Lee', 'Brooks', 'Carter', 'Nguyen', 'Patel', 'Kim', 'Johnson', 'Rivera', 'Walsh', 'Bennett', 'Foster', 'Hayes', 'Murphy', 'Chen', 'Reed', 'Price', 'Coleman', 'Ward', 'Ortiz', 'Shaw'],
  'Latin America': ['Lima', 'Nunes', 'Rocha', 'Prado', 'Rojas', 'Silva', 'Gómez', 'Cruz', 'Ruiz', 'Souza', 'Almeida', 'Castro', 'Moreira', 'Vargas', 'Pereira', 'Torres', 'Barbosa', 'Mendoza', 'Ramos', 'Cardoso'],
  EMEA: ['Becker', 'Wagner', 'Braun', 'Hoffmann', 'Byrne', 'Kelly', 'Clarke', 'Hughes', 'Dubois', 'Laurent', 'García', 'Navarro', 'Rossi', 'Bianchi', 'Jensen', 'Müller', 'Haddad', 'Mansour', 'Lindqvist', 'Keller'],
  APAC: ['Tan', 'Lim', 'Sato', 'Tanaka', 'Sharma', 'Iyer', 'Wong', 'Chan', 'Nakamura', 'Mehta', 'Ng', 'Koh', 'Suzuki', 'Kapoor', 'Ho', 'Goh', 'Yamamoto', 'Rao', 'Leung', 'Ong'],
};

export function nameMaker(pick: <T>(a: readonly T[]) => T) {
  const used = new Set<string>();
  return (region: Region) => {
    for (let i = 0; i < 40; i++) {
      const n = `${pick(FIRST[region])} ${pick(LAST[region])}`;
      if (!used.has(n)) {
        used.add(n);
        return n;
      }
    }
    const n = `${pick(FIRST[region])} ${String.fromCharCode(65 + (used.size % 26))}. ${pick(LAST[region])}`;
    used.add(n);
    return n;
  };
}
