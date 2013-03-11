var spawn = require('child_process').spawn,
    exec = require('child_process').exec,
    request = require('request'),
    fileSystem = require('fs'),
    path = require('path'),
    youtube = require('youtube-feeds');

exports.youtube = function(req, response){
    response.contentType = 'audio/mpeg3';
    youtube.feeds.playlist(req.params.playlist, function( err, data ) {
        if(!err) {
            urls = [];
            for(x in data.items){
                urls.push('http://www.youtube.com/watch?v='+data.items[x].video.id);
            }
            console.log(urls);
            encode(0, urls);
        }
    });

    function encode(item, urls){
        var youtube_dl_cmd = 'youtube-dl --simulate --get-url ';
        youtube_dl_cmd += urls[item];
        console.log('next url: '+urls[item]);

        var youtube_dl_child = exec(youtube_dl_cmd, function(err, stdout, stderr){
            video_url = stdout.toString();
            video_url = video_url.substring(0, video_url.length - 1); // remove trailing

            var params = [
                    '-y',
                    '-i',
                    'pipe:0',
                    '-acodec',
                    'libmp3lame',
                    '-threads',
                    '1',
                    '-f',
                    'mp3',
                    '-'
                ];

            var ffmpeg = spawn('ffmpeg', params);

            request({
                'url': video_url,
                'headers': { 'Youtubedl-no-compression': true }
            }).pipe(ffmpeg.stdin);

            ffmpeg.stdout.pipe(response, { end:false});
            ffmpeg.stdout.on('end', function (code) {

                //playlist size control
                var next = item+1;
                if(next < urls.length){
                    encode(next, urls);
                }else{
                    console.log('stream finished');
                }
            });
        });
    }
};