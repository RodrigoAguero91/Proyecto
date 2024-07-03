

export const chatController = (req, res) => {
    const userAdminControl = req.session.user.email != 'rodrigo@gmail.com'? true : false;
    res.render('chat', { email: userAdminControl });
}