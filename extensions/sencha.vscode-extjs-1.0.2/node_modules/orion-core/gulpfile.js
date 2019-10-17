var gulp = require('gulp');
var jasmine = require('gulp-jasmine');
var reporters = require('jasmine-reporters');
var terminalReporter = require('jasmine-terminal-reporter');
var Reporter = getReporterClass();

gulp.task('default', function() {
    console.log('Default task');
});

gulp.task('test', function () {
    return gulp.src('test/**/*.js')
        .pipe(jasmine({
            reporter: new Reporter({
                includeStackTrace: true,
                isVerbose: false,
                print: function (data) {
                    if (data !== '\n') { // not sure why output includes so many empty lines when errors are reported.
                        process.stdout.write(data + '\n');
                    }
                }
            })
        }));
});

function getReporterClass () {
    console.log("isTeamCity?"+isTeamCity());
    return isTeamCity() ? reporters.TeamCityReporter : terminalReporter;
}

function isTeamCity () {
    return typeof process.env.TEAMCITY_VERSION !== 'undefined';
}
