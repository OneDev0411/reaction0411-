###
# Payments Schema
###
ReactionCore.Schemas.PaymentMethod = new SimpleSchema
  processor:
    type: String
  storedCard:
    type: String
    optional: true
  method:
    type: String
    optional: true
  transactionId:
    type: String
  status:
    type: String
    allowedValues: ["created", "approved", "failed", "canceled", "expired", "pending", "voided", "settled"]
  mode:
    type: String
    allowedValues: ["sale", "authorization", "order"]
  createdAt:
    type: Date
    optional: true
  updatedAt:
    type: Date
    optional :true
  authorization:
    type: String
    optional: true
  amount:
    type: Number
    decimal: true
  transactions:
    type: [Object]
    optional: true
    blackbox: true

ReactionCore.Schemas.Payment = new SimpleSchema
  address:
    type: ReactionCore.Schemas.Address
    optional: true
  paymentMethod:
    type: [ReactionCore.Schemas.PaymentMethod]
    optional: true


###
# Orders
###
ReactionCore.Schemas.Document = new SimpleSchema
  docId:
    type: String
  docType:
    type: String
    optional: true

ReactionCore.Schemas.History = new SimpleSchema
    event:
      type: String
    userId:
      type: String
    updatedAt:
      type: Date

ReactionCore.Schemas.OrderItems = new SimpleSchema
  additionalField:
    type: String
    optional: true
  status:
    type: String
  history:
    type: [ReactionCore.Schemas.History]
    optional: true
  documents:
    type: [ReactionCore.Schemas.Document]
    optional: true