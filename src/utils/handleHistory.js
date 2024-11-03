


const handleHistory = async (inside, _state) => {
    let history
    try {
        history = _state.get('history')
    } catch (error) {
        history =  []
    }
    history.push(inside)
    await _state.update({ history })
}


const getHistoryParse = (_state, k = 15) => {
    const history = _state.get('history') ?? []
    const limitHistory = history.slice(-k)
    return limitHistory.reduce((prev, current) => {
        const msg = current.role === 'user' ? `Customer: "${current.content}"` : `\nSeller: "${current.content}"\n`
        prev += msg
        return prev
    }, ``)
}

const clearHistory = async (_state) => {
    _state.clear()
}

module.exports = {
    handleHistory,
    getHistoryParse,
    clearHistory
}