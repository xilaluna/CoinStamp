import { Charge, Webhook } from "../config/coinbase.js"
import easypost from "../config/easypost.js"

export const getStamp = async (req, res) => {
  res.redirect("/order")
}

export const createStamp = async (req, res) => {
  const stamp = req.body
  const toAddressData = {
    verify: ["true"],
    name: stamp.toName,
    street1: stamp.toStreet1,
    street2: stamp.toStreet2,
    city: stamp.toCity,
    state: stamp.toState,
    zip: stamp.toZip,
    country: stamp.toCountry,
    phone: stamp.toPhone,
  }
  const fromAddressData = {
    verify: ["true"],
    name: stamp.fromName,
    street1: stamp.fromStreet1,
    street2: stamp.fromStreet2,
    city: stamp.fromCity,
    state: stamp.fromState,
    zip: stamp.fromZip,
    country: stamp.fromCountry,
    phone: stamp.fromPhone,
  }
  const parcelInfoData = {
    predefined_package: stamp.predefined_package,
    length: parseFloat(stamp.packageLength),
    width: parseFloat(stamp.packageWidth),
    height: parseFloat(stamp.packageHeight),
    weight:
      parseFloat(stamp.packageWeightOunces) + parseFloat(stamp.packageWeightPounds) * 16,
  }
  try {
    const toAddress = await new easypost.Address(toAddressData)
    const fromAddress = await new easypost.Address(fromAddressData)
    const parcelInfo = await new easypost.Parcel(parcelInfoData)

    const shipment = await new easypost.Shipment({
      to_address: toAddress,
      from_address: fromAddress,
      parcel: parcelInfo,
    })

    const response = await shipment.save()

    res.status(201).json(response)
  } catch (error) {
    res.status(409).json({ message: error.message })
  }
}

export const checkoutStamp = async (req, res) => {
  const order = req.body
  let rate = 0

  try {
    const shipment = await easypost.Shipment.retrieve(order.shipment.id)
    for (let i = 0; i < shipment.rates.length; i++) {
      if (shipment.rates[i].id === order.rate.id) {
        rate += parseFloat(shipment.rates[i].rate)
        break
      }
    }
    const charge = await Charge.create({
      name: "Stamp",
      description: `${order.rate.carrier}, ${order.rate.service} (${order.addresses.from_address.name} to ${order.addresses.to_address.name})`,
      local_price: {
        amount: 0.01,
        currency: "USD",
      },
      pricing_type: "fixed_price",
    })

    res.status(201).json(charge)
  } catch (error) {
    res.status(409).json({ message: error.message })
  }
}

export const getAddresses = async (req, res) => {
  try {
    const toAddress = await easypost.Address.retrieve(req.query.to_address)
    const fromAddress = await easypost.Address.retrieve(req.query.from_address)

    res.status(200).json({ to_address: toAddress, from_address: fromAddress })
  } catch (error) {
    res.status(400).json({ message: error })
  }
}

export const orderStamp = async (req, res) => {
  const rawBody = req.rawBody
  const signature = req.headers["x-cc-webhook-signature"]
  const webhookSecret = process.env.WEBHOOK_SECRET
  const shipmentId = req.query.shipment
  const rateId = req.query.rate

  try {
    const event = Webhook.verifyEventBody(rawBody, signature, webhookSecret)

    // if (event.type === "charge:pending") {
    //   // TODO
    //   // user paid, but transaction not confirm on blockchain yet
    // }

    if (event.type === "charge:confirmed") {
      const shipment = await easypost.Shipment.retrieve(shipmentId)
      const boughtShipment = await shipment.buy(rateId)

      res.json(boughtShipment)
    }

    if (event.type === "charge:failed") {
      res.json("failed")
    }
    res.status(201)
  } catch (error) {
    res.status(409).json({ message: error })
  }
}
