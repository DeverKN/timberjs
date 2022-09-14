export default (req, res) => {
    res.render({
        msg: 'Hello!',
        baseCount: req.query.count ?? 88
    })
}