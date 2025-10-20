"use client"

import type { Route } from "react-router";
import { useState } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse } from "react-router";
import "bootstrap/dist/css/bootstrap.min.css";
import { 
    Button,
    HStack, 
    Avatar, 
    Card,
    Field,
    Input,
    Stack,
    Drawer,
    CloseButton,
    Portal
} from "@chakra-ui/react";

export const DrawerDemo = () => {
  const [open, setOpen] = useState(false)

  return (
    <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)} placement="start" size="xs">
      <Drawer.Trigger asChild>
        <Button variant="outline" size="sm" rounded={10}>
          Bus Smart
        </Button>
      </Drawer.Trigger>
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner padding={4}>
          <Drawer.Content rounded={10}>
            <Drawer.Header>
              <Drawer.Title>Bus Smart 1.0.0</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
              <p>
                Tracking học sinh
              </p>
            </Drawer.Body>
            <Drawer.Footer>
              <Button variant="outline" rounded={10}>Cancel</Button>
              <Button rounded={10}>Lưu</Button>
            </Drawer.Footer>
            <Drawer.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}


export function Nhap() {
    return (
        <Button>Click me</Button>
    );
}

export function CardDemo() {
  return (
    <Card.Root width="320px">
      <Card.Body gap="2">
        <Avatar.Root size="lg" shape="rounded">
          <Avatar.Image src="/buslogo.ico" />
          <Avatar.Fallback name="Nue Camp" />
        </Avatar.Root>
        <Card.Title mt="2">Nue Camp</Card.Title>
        <Card.Description>
          This is the card body. Lorem ipsum dolor sit amet, consectetur
          adipiscing elit. Curabitur nec odio vel dui euismod fermentum.
          Curabitur nec odio vel dui euismod fermentum.
        </Card.Description>
      </Card.Body>
      <Card.Footer justifyContent="flex-end">
        <Button variant="outline">View</Button>
        <Button>Join</Button>
      </Card.Footer>
    </Card.Root>
  );
}

export function SignUp() {
   return (
    <Card.Root maxW="sm">
        <Card.Header>
        <Card.Title>Sign up</Card.Title>
        <Card.Description>
            Fill in the form below to create an account
        </Card.Description>
        </Card.Header>
        <Card.Body>
        <Stack gap="4" w="full">
            <Field.Root>
            <Field.Label>First Name</Field.Label>
            <Input />
            </Field.Root>
            <Field.Root>
            <Field.Label>Last Name</Field.Label>
            <Input />
            </Field.Root>
        </Stack>
        </Card.Body>
        <Card.Footer justifyContent="flex-end">
        <Button variant="outline">Cancel</Button>
        <Button variant="solid">Sign in</Button>
        </Card.Footer>
    </Card.Root>
   );
}