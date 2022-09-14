export default (req, res) => {
    res.render({
        name: req.query.name ?? 'Dever'
    })
}