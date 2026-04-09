import dns from 'dns';

const targetSrv = '_mongodb._tcp.forkcastdb.ca5c5qu.mongodb.net';
const targetTxt = 'forkcastdb.ca5c5qu.mongodb.net';

function test(label) {
  console.log(`\n=== ${label} ===`);
  console.log('DNS servers:', dns.getServers());

  dns.resolveSrv(targetSrv, (err, records) => {
    console.log('SRV:', err ? err.message : records);

    dns.resolveTxt(targetTxt, (err2, records2) => {
      console.log('TXT:', err2 ? err2.message : records2);
    });
  });
}

test('default');

setTimeout(() => {
  dns.setServers(['8.8.8.8']);
  test('google');
}, 1000);