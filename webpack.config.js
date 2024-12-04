const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

// import 'webpack-dev-server';

const isProduction = process.env.NODE_ENV === 'production';

const cMapsDir = path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'cmaps');
const standardFontsDir = path.join(
    path.dirname(require.resolve('pdfjs-dist/package.json')),
    'standard_fonts',
);

module.exports = {
    mode: isProduction ? 'production' : 'development',
    /**
     * Critical: prevents "Uncaught TypeError: Object.defineProperty called on non-object" error
     */
    devtool: 'cheap-source-map',
    bail: isProduction,
    context: path.join(__dirname),
    entry: {
        src: './index.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    module: {
        rules: [
            {
                test: /\.(j|t)sx?$/,
                use: ['babel-loader'],
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.pdf$/,
                use: ['file-loader'],
            },
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader'
                ]
            },
            {
                test: /\.(ttf|eot|svg|woff|woff2)$/,
                use: 'url-loader'
            },
            {
                test: /\.(png|jpg|gif|jpeg)$/,
                use: [{
                    loader: 'url-loader',
                    // loader: 'file-loader',
                    options: {
                        esModule: false, 
                        name: '[name].[hash:7].[ext]',
                        limit: 5120,
                        outputPath: './images',
                        publicPath: '/images'
                    }
                }]
            },
            {
                test: /\.mjs$/,
                include: /node_modules/,
                type: 'javascript/auto'
            }
        ],
    },
    optimization: {
        runtimeChunk: 'single',
        splitChunks: {
            chunks: 'all',
            maxInitialRequests: Infinity,
            minSize: 0,
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name(module) {
                        // get the name. E.g. node_modules/packageName/not/this/part.js
                        // or node_modules/packageName
                        const packageName = module.context.match(
                            /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                        )[1]

                        // npm package names are URL-safe, but some servers don't like @ symbols
                        return `npm.${packageName.replace('@', '')}`
                    },
                },
            },
        },
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV),
            },
        }),
        new HtmlWebpackPlugin({
            template: 'index.html',
        }),
        new CopyWebpackPlugin({
            patterns: [
                // { from: 'assets', to: 'assets'},
                { from: cMapsDir, to: 'cmaps/' },
                { from: standardFontsDir, to: 'standard_fonts/' },
            ],
        }),
    ],
    devServer: {
        compress: true,
        historyApiFallback: true,
        host: 'localhost',
        hot: true,
        // port: 3000,
    },
};

// export default config;
