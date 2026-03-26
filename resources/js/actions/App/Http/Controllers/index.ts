import WebhookController from './WebhookController'
import Api from './Api'
import Auth from './Auth'
import DashboardController from './DashboardController'
import ProductController from './ProductController'
import OrderController from './OrderController'
import CatalogController from './CatalogController'
import ChatController from './ChatController'
import SettingsController from './SettingsController'

const Controllers = {
    WebhookController: Object.assign(WebhookController, WebhookController),
    Api: Object.assign(Api, Api),
    Auth: Object.assign(Auth, Auth),
    DashboardController: Object.assign(DashboardController, DashboardController),
    ProductController: Object.assign(ProductController, ProductController),
    OrderController: Object.assign(OrderController, OrderController),
    CatalogController: Object.assign(CatalogController, CatalogController),
    ChatController: Object.assign(ChatController, ChatController),
    SettingsController: Object.assign(SettingsController, SettingsController),
}

export default Controllers