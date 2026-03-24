import AuthController from './AuthController'
import ProductController from './ProductController'
import StockController from './StockController'
import OrderController from './OrderController'
import ChatController from './ChatController'
import MessageController from './MessageController'
import CatalogController from './CatalogController'
const Api = {
    AuthController: Object.assign(AuthController, AuthController),
ProductController: Object.assign(ProductController, ProductController),
StockController: Object.assign(StockController, StockController),
OrderController: Object.assign(OrderController, OrderController),
ChatController: Object.assign(ChatController, ChatController),
MessageController: Object.assign(MessageController, MessageController),
CatalogController: Object.assign(CatalogController, CatalogController),
}

export default Api