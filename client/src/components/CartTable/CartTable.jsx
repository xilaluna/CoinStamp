import React from "react"

import Typography from "@mui/material/Typography"
import TableContainer from "@mui/material/TableContainer"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"

import Item from "./Item"
import { useSelector } from "react-redux"

const CartTable = () => {
  const cart = useSelector((state) => state.cart.cart)
  const items = cart.map((obj) => {
    const { shipment, addresses, rate } = obj
    return (
      <Item
        key={`${shipment.id}-${addresses.from_address.name}`}
        id={shipment.id}
        carrier={rate.carrier}
        service={rate.service}
        fromName={addresses.from_address.name}
        toName={addresses.to_address.name}
        rate={rate.rate}
      />
    )
  })
  return (
    <React.Fragment>
      <Typography variant="h5" gutterBottom>
        Cart
      </Typography>
      <TableContainer>
        {cart.length > 0 ? (
          <Table>
            <TableBody>{items}</TableBody>
          </Table>
        ) : (
          <Typography>No items in cart</Typography>
        )}
      </TableContainer>
    </React.Fragment>
  )
}

export default CartTable
