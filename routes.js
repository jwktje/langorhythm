
Router.map(function() {
    this.route('serverFile', {
        where: 'server',
        path: /^\/midi\/(.*)$/,
        action: function() {
            var filePath = process.env.PWD + '/.midifiles/' + this.params[0];
            var data = fs.readFileSync(filePath);
            this.response.writeHead(200, {
                'Content-Type': 'audio/midi'
            });
            this.response.write(data);
            this.response.end();
        }
    });
});

Router.route('/', function () {
    this.render('test');
});