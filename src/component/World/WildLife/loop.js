import React from 'react'
import { WildLife as SimpleWildLife } from './index'
import type { PointPolar } from '../../../util/math/pointPolar'

export type Props = {
    world: World_type,
    size: number,
}

const home_by_type = {
    pinguin: 0,
    bernie: 4.7,
    camel: 3.1,
}

const compareAngle = (ref, a) => (a - ref + Math.PI) % (Math.PI * 2) - Math.PI

export class WildLife extends React.Component {
    state = {
        entities: Array.from({ length: 16 }).map((_, i) => {
            const r = (i * 117 + i * i * 37) % 17 / 17

            const type = Object.keys(home_by_type)[
                Math.floor(r * Object.keys(home_by_type).length)
            ]

            return {
                type,
                theta: home_by_type[type] + i % 4 * 0.2,
                t: 0,
                v: 0,
                tint: (i * 17 + i * i * 37) % 45 / 45,
            }
        }),
    }

    _timeout: number | null = null

    loop = () => {
        const delta = this.props.gameSpeed

        this.setState({
            entities: this.state.entities.map(entity => {
                entity.theta += entity.v * delta

                const home = home_by_type[entity.type]

                entity.t -= delta

                if (entity.t < 0) {
                    entity.t = 0 | (Math.random() * 70 + 60)

                    if (Math.random() < 0.5) entity.v = 0
                    else {
                        const c = compareAngle(home, entity.theta)

                        const direction = c > 0 ? -1 : 1

                        entity.v = direction * ((Math.random() + 1) * 0.0039)
                    }
                }

                return entity
            }),
        })

        if ('undefined' !== typeof requestAnimationFrame)
            this._timeout = requestAnimationFrame(this.loop)
    }

    componentWillMount() {
        if ('undefined' !== typeof requestAnimationFrame)
            this._timeout = requestAnimationFrame(this.loop)
    }

    componentWillUnmount() {
        if ('undefined' !== typeof cancelAnimationFrame)
            cancelAnimationFrame(this._timeout)
    }

    render() {
        return <SimpleWildLife {...this.props} {...this.state} />
    }
}
