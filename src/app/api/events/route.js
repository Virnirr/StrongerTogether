import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { checkLoggedIn } from "@/lib/auth";
import { USER_NOT_SIGNED_IN } from "@/lib/response";

export async function POST(request) {
  const loggedInData = await checkLoggedIn();
  if (loggedInData.loggedIn) {
    // if user is logged in, then create the event if needed
    const userId = loggedInData.user.id;
    const responseData = await request.json();
    const { eventName, location, startTime, endTime, maxAttendee, filterIds } =
      responseData;
    const eventData = {
      eventName: eventName,
      location: location,
      startTime: startTime,
      endTime: endTime,
      maxAttendee: parseInt(maxAttendee),
      hostId: userId
    };
    
    // Check if filterIds array is not empty
    if (filterIds && filterIds.length > 0) {
      eventData.EventFilter = {
        create: filterIds.map(id => ({
          possibleFilter: {
            connect: {
              id: id,
            },
          },
        })),
      };
    }
    console.log(eventData);
    let events;
    try {
      events = await prisma.Event.create({ 
        data: eventData,
        include: {
          host: {
            select: {
              name: true
            }
          }
        }
      });
    } catch (e) {
      console.log(e);
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    // simple console.log logger (need to add an actual logger in the future)
    console.log("LOGGED EVENTS", events);
    return NextResponse.json(events);
  }
  return USER_NOT_SIGNED_IN;
}

export async function GET(request) {
  // send in GET request as query in URL
  const loggedInData = await checkLoggedIn();
  // const { id } = router.query;
  if (loggedInData.loggedIn) {
    const searchParams = request.nextUrl.searchParams;
    // Get all 'filters' query parameters as an array
    let filters = searchParams.getAll("filters");
    filters = filters.map((value) => parseInt(value));
    let allEvents;
    try {
      if (filters.length > 0) {
        // Query: return all events where at least one post (some) has the filtered option ordered
        // by startTime; meaning, the earliest go first.
        allEvents = await prisma.Event.findMany({
          where: {
            EventFilter: {
              some: {
                possibleFilterId: {
                  in: filters,
                },
              },
            },
          },
          // include all the filters
          include: {
            EventFilter: {
              select: {
                possibleFilter: {
                  select: {
                    filterType: true,
                  },
                },
              },
            },
            host: {
              select: {
                name: true
              }
            },
            EventAttendee: {
              select: {
                name: true
              }
            }
          },
          // order by the startTime and endTime in descending order 
          orderBy: [{ startTime: "desc" }, { endTime: "desc" }],
        });
      } else {
        // if no filter, return everything
        allEvents = await prisma.Event.findMany(
          {
                      // include all the filters
          include: {
            EventFilter: {
              select: {
                possibleFilter: {
                  select: {
                    filterType: true,
                  },
                },
              },
            },
            host: {
              select: {
                name: true
              }
            },
            EventAttendee: {
              select: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          }
        );
      }
    } catch (e) {
      console.log(e.message);
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    console.log(JSON.stringify(allEvents, null, 2)); // simple logger that logs out all the events and the filters
    return NextResponse.json(allEvents);
  }
  return USER_NOT_SIGNED_IN;
}

export async function DELETE(request) {
  // delete events and cascade delete all the event attendees
  const loggedInData = await checkLoggedIn();
  if (loggedInData.loggedIn) {
    const responseData = await request.json();
    const { id } = responseData;
    let eventDeleted;
    try {
      eventDeleted = await prisma.Event.delete({
        where: {
          id,
        },
      });
    } catch (e) {
      console.log(e.message);
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    return NextResponse.json(eventDeleted);
  }
  return USER_NOT_SIGNED_IN;
}

export async function PATCH(request) {
  // delete events and cascade delete all the event attendees
  const loggedInData = await checkLoggedIn();
  if (loggedInData.loggedIn) {
    const responseData = await request.json();
    const userId = loggedInData.user.id;
    const {
      id,
      eventName,
      location,
      startTime,
      endTime,
      maxAttendee,
      filterIds,
    } = responseData;
    const eventData = {
      eventName: eventName,
      location: location,
      startTime: startTime,
      endTime: endTime,
      maxAttendee: parseInt(maxAttendee),
      hostId: userId, // change this to something more dynamic
      EventFilter: {
        // add filters to the events and connect them to existing possible filters
        create: filterIds.map((id) => ({
          possibleFilter: {
            connect: {
              id: id,
            },
          },
        })),
      },
    };
    console.log(eventData);
    let updatedEvent, deletedFilters;
    try {
      deletedFilters = await prisma.EventFilter.deleteMany({
        where: {
          eventId: id,
        },
      });
      updatedEvent = await prisma.Event.update({
        where: {
          id,
        },
        data: eventData,
      });
      console.log(deletedFilters);
      console.log(updatedEvent);
    } catch (e) {
      console.log(e.message);
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    return NextResponse.json(updatedEvent);
  }
  return USER_NOT_SIGNED_IN;
}
