import { createStore, applyMiddleware, compose } from 'redux'
import { defaultState, reduce } from './reducer'
import { start } from './action/game'
import { init as initUI } from './sideEffect/ui'
import { init as initScheduler } from './sideEffect/scheduler'
import { imageLoader } from './util/imageLoader'

let store
{
    const crashReporter = store => next => action => {
        try {
            return next(action)
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Caught an exception!', err)
            throw err
        }
    }

    // create redux store
    const middlewares = [crashReporter]
    const enhancers = [
        ...('undefined' != typeof window && window.__REDUX_DEVTOOLS_EXTENSION__
            ? [window.__REDUX_DEVTOOLS_EXTENSION__()]
            : []),
        applyMiddleware(...middlewares),
    ]

    store = createStore(reduce, defaultState, compose(...enhancers))
}

;[initUI, initScheduler].forEach(init => init(store))

Promise.all(
    [
        require('./asset/image/ciel.png'),
        require('./asset/image/terre.png'),
        require('./asset/image/surface.png'),
        require('./asset/image/textureblanche.png'),
        require('./asset/image/texturegrise.png'),
        require('./asset/image/texturejaune.png'),
        require('./asset/image/textureverte.png'),
    ].map(url => imageLoader.load(url))
).then(() => store.dispatch(start()))
