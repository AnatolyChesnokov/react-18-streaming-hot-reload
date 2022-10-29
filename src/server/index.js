const babelRegister = require('@babel/register');
babelRegister({
    ignore: [/[\\\/](build|server\/server|node_modules)[\\\/]/],
    presets: [['@babel/preset-react', { runtime: 'automatic' }]],
    plugins: ['@babel/transform-modules-commonjs'],
});

const express = require('express');
const { readFileSync } = require('fs');
const path = require('path');
const compress = require('compression');

const PORT = process.env.PORT || 4000;
const app = express();

const handleErrors = (fn) => {
    return async (req, res, next) => {
        try {
            return await fn(req, res);
        } catch (x) {
            next(x);
        }
    };
};

app.use(compress());
// Application
app.get(
    '/',
    handleErrors(async (req, res) => {
        await waitForWebpack();
        const render = require('./render').default;
        render(req, res);
    }),
);

app.use(express.static('build'));
app.use(express.static('public'));

if (process.env.NODE_ENV === 'development') {
    process.env.APP_ENV = 'browser';
    const webpackConfig = require('../../scripts/build');

    const webpackDevMiddleware = require('webpack-dev-middleware');
    const webpackHotMiddleware = require('webpack-hot-middleware');

    app.use(
        webpackDevMiddleware(webpackConfig, {
            publicPath: webpackConfig.options.output.publicPath,
            serverSideRender: true,
            writeToDisk: true,
        }),
    );
    app.use(
        webpackHotMiddleware(webpackConfig, {
            path: '/__webpack_hmr',
        }),
    );
}

app.listen(PORT, () => {
    console.log(`Listening at ${PORT}...`);
}).on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const isPipe = (portOrPipe) => Number.isNaN(portOrPipe);
    const bind = isPipe(PORT) ? `Pipe ${PORT}` : `Port ${PORT}`;
    switch (error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
});

const waitForWebpack = async () => {
    while (true) {
        try {
            readFileSync(path.resolve(__dirname, '../../build/main.js'));
            return;
        } catch (err) {
            console.log('Could not find webpack build output. Will retry in a second...');
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
};
