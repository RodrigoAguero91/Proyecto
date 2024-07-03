import { Router } from "express";
import { isAuthenticated, isAdmin } from "../public/js/authMiddleware.js";
import { 
    viewsUserRegisterController,
    viewsUserLoginController,
    viewsUserProfileController,
    viewsUserLogoutController,
    viewsUserForgetPasswordController,
    viewUserStateController 
} from "../controllers/viewsUser.controller.js";

const router = Router();


router.get('/register', viewsUserRegisterController); 

router.get('/login', viewsUserLoginController); 
router.get('/profile', isAuthenticated, viewsUserProfileController); 

router.get('/logout', isAuthenticated, viewsUserLogoutController); 

router.get('/forget-password', viewsUserForgetPasswordController);

router.get('/users', isAdmin, viewUserStateController) 

export default router;