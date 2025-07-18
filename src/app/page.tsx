import Link from "next/link";
import { auth } from "~/server/auth";
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Button,
  SimpleGrid,
  Card,
  Icon,
  HStack,
} from "@chakra-ui/react";
import { FiShield, FiLock, FiUsers, FiClock } from "react-icons/fi";

export default async function HomePage() {
  const session = await auth();

  return (
    <Box>
      {/* Hero Section */}
      <Box bg="bg.subtle" py={{ base: 16, md: 24 }}>
        <Container maxW="4xl">
          <Stack gap={8} align="center" textAlign="center">
            <Stack gap={4}>
              <Heading
                size={{ base: "2xl", md: "3xl" }}
                fontWeight="bold"
              >
                Secure Your Digital Legacy
              </Heading>
              <Text fontSize={{ base: "lg", md: "xl" }} color="fg.muted" maxW="2xl">
                Corvo is a self-hosted platform that automatically distributes your digital
                assets and information to trusted recipients upon your death or incapacitation.
              </Text>
            </Stack>

            <HStack gap={4}>
              {session ? (
                <Button asChild size="lg" colorScheme="blue">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" colorScheme="blue">
                    <Link href="/auth/signup">Get Started</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                </>
              )}
            </HStack>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxW="6xl" py={{ base: 16, md: 24 }}>
        <Stack gap={12}>
          <Stack gap={4} align="center" textAlign="center">
            <Heading size="xl">Why Choose Corvo?</Heading>
            <Text fontSize="lg" color="fg.muted" maxW="2xl">
              Take control of your digital afterlife with powerful features designed for
              security, privacy, and peace of mind.
            </Text>
          </Stack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={8}>
            <Card.Root>
              <Card.Body>
                <Stack gap={4}>
                  <Icon boxSize={10} color="blue.500">
                    <FiLock />
                  </Icon>
                  <Heading size="md">End-to-End Encryption</Heading>
                  <Text color="fg.muted">
                    Your data is encrypted before it leaves your device, ensuring
                    complete privacy and security.
                  </Text>
                </Stack>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body>
                <Stack gap={4}>
                  <Icon boxSize={10} color="blue.500">
                    <FiClock />
                  </Icon>
                  <Heading size="md">Dead Man&apos;s Switch</Heading>
                  <Text color="fg.muted">
                    Automated check-in system that triggers asset distribution if
                    you become incapacitated.
                  </Text>
                </Stack>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body>
                <Stack gap={4}>
                  <Icon boxSize={10} color="blue.500">
                    <FiUsers />
                  </Icon>
                  <Heading size="md">Trusted Recipients</Heading>
                  <Text color="fg.muted">
                    Designate specific people to receive your digital assets with
                    granular access controls.
                  </Text>
                </Stack>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body>
                <Stack gap={4}>
                  <Icon boxSize={10} color="blue.500">
                    <FiShield />
                  </Icon>
                  <Heading size="md">Self-Hosted</Heading>
                  <Text color="fg.muted">
                    Run Corvo on your own infrastructure for complete control over
                    your sensitive data.
                  </Text>
              </Stack>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>
        </Stack>
      </Container>

      {/* CTA Section */}
      {!session && (
        <Box bg="bg.subtle" py={{ base: 16, md: 20 }}>
          <Container maxW="4xl">
            <Stack gap={8} align="center" textAlign="center">
              <Stack gap={4}>
                <Heading size="xl">Ready to Secure Your Digital Legacy?</Heading>
                <Text fontSize="lg" color="fg.muted">
                  Join thousands who trust Corvo to protect their digital assets.
                </Text>
              </Stack>
              <Button asChild size="lg" colorScheme="blue">
                <Link href="/auth/signup">Create Free Account</Link>
              </Button>
            </Stack>
          </Container>
        </Box>
      )}
    </Box>
  );
}