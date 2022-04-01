
const ChildProcess = require('child_process');

const runCmd = (cmd, args = []) => {
  return new Promise((resolve, reject) => {
    let job = ChildProcess.spawn(cmd, args);
    let data_buffers = [];
    let error_buffers = [];
    job.stdout.on('data', function (data) {
      data_buffers.push(data);
    });
    job.stderr.on('data', function (data) {
      error_buffers.push(data);
    });
    job.on('exit', function (code) {
      let data = Buffer.concat(data_buffers).toString();
      let error = Buffer.concat(error_buffers).toString();
      if (error) {
        reject(error);
      }
      resolve(data);
    });
  });
};

(async () => {
  let res = await runCmd('git', ['log', '--decorate=short', '--pretty=oneline', '--date=format:"%Y-%m-%d"', '--abbrev-commit']);
  res = res.split('\n').slice(1, -1);

  let changelogs = {
    'feat': [],
    'fix': [],
    'docs': [],
    'perf': [],
    'refactor': []
  };
  let showTypes = Object.keys(changelogs);

  for (let i=0; i<res.length; i++) {
    let line = res[i].substring(8);
    if (line.indexOf('tag:') !== -1) break;
    let matched = line.match(/(.+)(\(.+\))?:\s*(.+)/);
    let type = matched[1];
    if (showTypes.findIndex(t => t === type) === -1) break;
    changelogs[type].push(matched[3]);
  }

  for (let type in changelogs) {
    let commits = changelogs[type];
    if (commits.length === 0) continue;

    console.log('## ' + type.charAt(0).toUpperCase() + type.substring(1) + '\n');
    for (let i=0; i<commits.length; i++) {
      console.log('* ' + commits[i]);
    }
    console.log('');
  }
})();
