const faker = require('faker');
const fs = require('fs')

faker.locale = "id_ID";

const LAYANAN_MAX_MEMBER = {
  Netflix: 5,
  Spotify: 6,
  Youtube: 5
}

let id = 0

function generateFakeGroups (layanan, N) {
  const groups = []
  for (let i = 0; i < N; i++) {
    groups.push({
      id: ++id,
      orders: [],
      memberCount: LAYANAN_MAX_MEMBER[layanan],
      layanan
    })
    for (let j = 0; j < LAYANAN_MAX_MEMBER[layanan]; j++) {
      groups[i].orders.push({
        namaDepan: faker.name.firstName(),
        namaBelakang: faker.name.lastName(),
      })
    }
  }
  return groups
}

const fakeGroups = {
  netflix: generateFakeGroups('Netflix', 8),
  spotify: generateFakeGroups('Spotify', 8),
  youtube: generateFakeGroups('Youtube', 8),
}

fs.writeFileSync(__dirname + '/fake-groups.js', 'module.exports = ' + JSON.stringify(fakeGroups, undefined, 2))
