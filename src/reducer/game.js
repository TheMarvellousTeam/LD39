import { set, merge } from '../util/redux'
import { toPoint } from '../util/math/pointPolar'
import { distance } from '../util/math/point'

import type { Action, State } from './type'
import type { Drill, Well } from '../type'

export const reduce = (state: State, action: Action): State => {
    if (!state.game) return state

    switch (action.type) {
        case 'game:tic': {
            const tic_money =
                state.game.bank.money -
                state.game.bank.outflow +
                state.game.bank.inflow
            let totalCost = 0
            let totalEarned = 0

            //TODO stock_exchange
            let newDelta = state.game.bank.deltaOil
            let newValue = state.game.bank.valueOil
            let proba = 0.5
            if (newValue > 100) {
                proba = 0.9
            } else if (newValue < 10) {
                proba = 0.3
            }
            if (Math.random() > proba) {
                newDelta = Math.min(
                    20,
                    newDelta + Math.floor(Math.random() * 5)
                )
            } else {
                newDelta = Math.max(
                    -5,
                    newDelta - Math.floor(Math.random() * 5)
                )
            }

            newValue = Math.floor(newValue * (1 + newDelta / 100))

            let world = state.game.world
            let oils = [...world.oilPockets]

            // update well
            const wells = world.wells.map((well: Well) => {
                let updatedWell = {
                    ...well,
                }

                const drill = well.drill
                // drilling case
                if (drill && drill.isDrilling) {
                    // drilling cost
                    totalCost += drill.drillClass.drilling_cost
                    // drills
                    updatedWell.bottom.r = Math.max(
                        1 - drill.drillClass.max_depth,
                        well.bottom.r - drill.drillClass.velocity
                    )

                    oils.forEach((oil, i) => {
                        const po = toPoint(oil.position)
                        const pw = toPoint(updatedWell.bottom)

                        if (distance(po, pw) < oil.radius) {
                            updatedWell.derrick = {
                                oilPocket: i,
                                derrickClass: drill.drillClass.derrickClass,
                            }
                            updatedWell.drill = null
                        }
                    })

                    // if depth == max_depth delete drill
                    if (
                        updatedWell.bottom.r ==
                        1 - drill.drillClass.max_depth
                    ) {
                        //TODO add sample
                        updatedWell.drill = null
                    }
                }

                let derrick = updatedWell.derrick
                if (derrick) {
                    totalCost += derrick.derrickClass.pumping_cost

                    const wannaPump = derrick.derrickClass.inflow
                    let pumped =
                        wannaPump <= oils[derrick.oilPocket].oil
                            ? wannaPump
                            : oils[derrick.oilPocket].oil

                    oils[derrick.oilPocket].oil -= pumped

                    totalEarned += pumped * newValue
                }

                return updatedWell
            })

            return {
                ...state,
                game: {
                    ...state.game,
                    world: {
                        ...world,
                        wells: wells,
                        oilPockets: oils,
                    },
                    bank: {
                        ...state.game.bank,
                        money: tic_money,
                        inflow: totalEarned,
                        outflow: totalCost,
                        valueOil: newValue,
                        deltaOil: newDelta,
                    },
                    day: state.game.day + 1 / 48,
                },
            }
        }

        case 'game:drill:place': {
            let game = state.game

            const { drillClass } = state.game.technologies.available.filter(
                x => x.type === 'drill'
            )[action.drillClassIndex]

            const newWell: Well = {
                bottom: {
                    theta: action.theta,
                    r: 1,
                },
                drill: {
                    drillClass: drillClass,
                    isDrilling: true,
                },
                derrick: null,
                samples: [],
            }

            // copy the game
            game = {
                ...game,

                // withdraw the cost of the drill
                money: game.money - drillClass.placement_cost,

                // copy the world
                world: {
                    ...game.world,

                    // add the drill to the world
                    wells: [...game.world.wells, newWell],
                },
            }

            return { ...state, game }
        }

        case 'game:drill:unlock': {
            let game = state.game

            let i = 0
            let k = action.drillClassIndex
            state.game.technologies.available.forEach((x, j) => {
                i = k === 0 ? j : i
                k = x.type == 'drill' ? k - 1 : k
            })

            return set(state, ['game', 'technologies', 'unlocked', i], true)
        }
    }
    return state
}
