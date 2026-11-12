// PROTOTYPE - NOT FOR PRODUCTION
// Typing Fever · word pools (utamakan Bahasa Indonesia)
// 2026-11-12
'use strict';

window.WORDS = {
  umum: [
    'kopi','hujan','malam','awan','bintang','lampu','meja','kursi','buku','pisang',
    'senja','angin','pelangi','kertas','pena','jendela','taman','kucing','roda','laut',
    'typing','fever','keyboard','gaming','pixel','window','garden','rocket','island','thunder',
    'galaxy','coffee','rabbit','planet','meadow','castle','journey','whisper','lantern','rainbow',
    'puzzle','fabric','marble','shadow','breeze','muffin','candle','harbor','diamond','feather',
    'compass','blanket','jasmine','machine','morning','pencil','silence','village','fortune','elastic',
    'gravity','biscuit','cabinet','dolphin','evening','mountain','keyboard','kucing','hujan','kopi',
    'roti','susu','teh','gula','garam','pintu','atap','lantai','dinding','langit',
    'tanah','air','api','es','salju','embun','kabut','mentari','rembulan','galaksi',
    'nebula','komet','asteroid','satelit','roket','orbit','stasiun','radio','gelombang','sinyal',
    'kabel','layar','papan','tombol','suara','musik','lagu','irama','nada','melodi'
  ],
  kafe: [
    'kopi','espresso','latte','cappuccino','americano','mocha','cangkir','saji','gelas','teko',
    'rak','buku','meja','kursi','sofa','bantal','lampu','gantung','menu','pesanan',
    'barista','seduh','teguk','aroma','busa','susu','aren','krimer','biskuit','kue',
    'tart','donat','croissant','roti','bakar','selai','kacang','keju','mentega','piring',
    'sendok','garpu','tisu','napkin','kompor','oven','microwave','kulkas','blender','pisau',
    'spatula','sedotan','tetangga','warung','kedai','antre','porsi','rasa','hangat','manis',
    'pahit','segar','lembut','gurih','harum','mendiang','poci','tubruk','giling','biji',
    'sangrai','filter','vakum','cream','gula','setiram','takar','timbang','aduk','kocok'
  ],
  hujan: [
    'hujan','gerimis','badai','petir','kilat','awan','mendung','langit','genangan','sungai',
    'selokan','payung','jas','kaos','kaki','sepatu','bot','hoodie','jaket','teh',
    'hangat','panggang','selimut','bantal','jendela','rayap','tetangga','rintik','tetes','embun',
    'basah','lembap','kabut','angin','deras','rambat','kucur','bom','jendela','kelopak',
    'genang','limpah','basah','kuyup','teduh','sejuk','rumput','daun','patah','runtuh',
    'pohon','ranting','akar','tanah','lumpur','beku','mencair','ujung','talang','atap',
    'seng','bising','gemericik','kamu','kopi','selimut','hangat','peluk','buai','tidur'
  ],
  alam: [
    'alam','sungai','gunung','lembah','bukit','pantai','ombak','pasir','karang','pohon',
    'daun','ranting','akar','bunga','benih','buah','biji','rumput','lumut','kayu',
    'batu','kerikil','matahari','angin','topan','semesta','bintang','bulan','awan','salju',
    'es','api','tanah','udara','hutan','belukar','semak','rusa','harimau','gajah',
    'kupu','lebah','semut','burung','elang','camar','tiram','kepiting','bintang','laut',
    'terumbu','laguna','air','terjun','gelombang','pasang','surut','karang','dangkalan','batu',
    'gunung','berapi','kawah','laras','debu','abu','lereng','puncak','jalur','pendakian'
  ],
  kota: [
    'kota','jalan','trotoar','halte','busway','bis','mobil','sepeda','motor','lampu',
    'lintas','zebra','asap','knalpot','gedung','plaza','mall','toko','warung','kaki',
    'lima','neon','papan','reklame','spanduk','jembatan','terowongan','stasiun','kereta','bandara',
    'pelabuhan','gedung','menara','lonceng','tengah','alun','taman','patung','bangunan','jendela',
    'lift','eskalator','tangga','lantai','atap','tembok','pagar','gapura','lampu','street',
    'arus','macet','ramai','sorak','tawa','langkah','sepatu','payung','koran','kedai'
  ],
  malam: [
    'malam','senja','fajar','subuh','tengah','keheningan','sepi','sunyi','gelap','remang',
    'cahaya','bulan','bintang','jendela','lampu','tidur','bantal','selimut','mimpi','burung',
    'hantu','jangkrik','krukukan','detik','jam','penjur','kelam','lilin','obor','suara',
    'bayang','sosok','lintas','angin','sepoi','rembulan','cahaya','redup','redup','kelip',
    'lampu','jalan','warung','tutup','kunci','pintu','bantal','kelap','kelip','bintang',
    'jendela','terbuka','kelopak','angin','malam','mendekat','subuh','jaga','terjaga','lenyap'
  ],
  tekno: [
    'teknologi','komputer','laptop','keyboard','mouse','layar','monitor','printer','scanner','kabel',
    'charger','baterai','sinyal','wifi','bluetooth','aplikasi','perangkat','lunak','kata','sandi',
    'pengguna','tautan','situs','unduh','unggah','simpan','hapus','ubah','tambah','cetak',
    'proses','data','basis','server','jaringan','alamat','protokol','enkripsi','kode','biner',
    'piksel','resolusi','grafis','animasi','suara','video','stream','platform','sistem','operasi',
    'memori','prosesor','hardware','firmware','driver','antarmuka','ikon','folder','arsip','format'
  ],
  rumah: [
    'rumah','ruang','tamu','dapur','kamar','makan','tidur','mandi','halaman','garasi',
    'atap','dinding','lantai','plafon','genteng','jendela','pintu','kunci','tangga','pagar',
    'taman','sofa','meja','kursi','lemari','rak','bantal','guling','selimut','kasur',
    'bantal','sabun','sampoo','handuk','cermin','gayung','sikat','gigi','pasta','tas',
    'sepatu','jaket','payung','topi','kunci','dompet','tas','piring','gelas','sendok',
    'panci','wajan','kompor','kulkas','rice','cooker','blender','sedotan','piring','gelas'
  ],
  acak: []
};

// dedupe tiap pool
for (const k of Object.keys(window.WORDS)) {
  if (k !== 'acak') window.WORDS[k] = [...new Set(window.WORDS[k])];
}

// acak = campuran semua pool
window.WORDS.acak = [...new Set(Object.keys(window.WORDS)
  .filter(function (k) { return k !== 'acak'; })
  .flatMap(function (k) { return window.WORDS[k]; }))];
